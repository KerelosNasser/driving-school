'use client';

import { DragItem, DropZone, ComponentPosition } from '../types/drag-drop';
import { EventEmitter } from 'events';

export interface DragDropOperation {
  id: string;
  type: 'add' | 'move' | 'delete';
  timestamp: string;
  userId: string;
  userName: string;
  componentId?: string;
  componentType?: string;
  oldPosition?: ComponentPosition;
  newPosition?: ComponentPosition;
  componentProps?: Record<string, any>;
  reversible: boolean;
}

export interface UndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
  undoStack: DragDropOperation[];
  redoStack: DragDropOperation[];
  currentIndex: number;
}

export class UndoRedoManager extends EventEmitter {
  private undoStack: DragDropOperation[] = [];
  private redoStack: DragDropOperation[] = [];
  private maxStackSize: number;
  private userId: string;
  private userName: string;

  constructor(userId: string, userName: string, maxStackSize = 50) {
    super();
    this.userId = userId;
    this.userName = userName;
    this.maxStackSize = maxStackSize;
  }

  // Record a new operation
  public recordOperation(operation: Omit<DragDropOperation, 'id' | 'timestamp' | 'userId' | 'userName'>): void {
    const fullOperation: DragDropOperation = {
      ...operation,
      id: this.generateOperationId(),
      timestamp: new Date().toISOString(),
      userId: this.userId,
      userName: this.userName
    };

    // Add to undo stack
    this.undoStack.push(fullOperation);
    
    // Clear redo stack when new operation is recorded
    this.redoStack = [];
    
    // Maintain max stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }

    this.emit('stateChanged', this.getState());
    this.emit('operationRecorded', fullOperation);
  }

  // Record component addition
  public recordAdd(componentId: string, componentType: string, position: ComponentPosition, props?: Record<string, any>): void {
    this.recordOperation({
      type: 'add',
      componentId,
      componentType,
      newPosition: position,
      componentProps: props,
      reversible: true
    });
  }

  // Record component move
  public recordMove(componentId: string, oldPosition: ComponentPosition, newPosition: ComponentPosition): void {
    this.recordOperation({
      type: 'move',
      componentId,
      oldPosition,
      newPosition,
      reversible: true
    });
  }

  // Record component deletion
  public recordDelete(componentId: string, componentType: string, position: ComponentPosition, props?: Record<string, any>): void {
    this.recordOperation({
      type: 'delete',
      componentId,
      componentType,
      oldPosition: position,
      componentProps: props,
      reversible: true
    });
  }

  // Undo the last operation
  public async undo(): Promise<DragDropOperation | null> {
    if (!this.canUndo()) {
      return null;
    }

    const operation = this.undoStack.pop()!;
    this.redoStack.push(operation);

    this.emit('stateChanged', this.getState());
    this.emit('undoExecuted', operation);

    return operation;
  }

  // Redo the last undone operation
  public async redo(): Promise<DragDropOperation | null> {
    if (!this.canRedo()) {
      return null;
    }

    const operation = this.redoStack.pop()!;
    this.undoStack.push(operation);

    this.emit('stateChanged', this.getState());
    this.emit('redoExecuted', operation);

    return operation;
  }

  // Check if undo is possible
  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  // Check if redo is possible
  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // Get current state
  public getState(): UndoRedoState {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoStack: [...this.undoStack],
      redoStack: [...this.redoStack],
      currentIndex: this.undoStack.length
    };
  }

  // Get the last operation
  public getLastOperation(): DragDropOperation | null {
    return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null;
  }

  // Get operation history
  public getHistory(limit?: number): DragDropOperation[] {
    const allOperations = [...this.undoStack];
    return limit ? allOperations.slice(-limit) : allOperations;
  }

  // Clear all history
  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.emit('stateChanged', this.getState());
    this.emit('historyCleared');
  }

  // Generate unique operation ID
  private generateOperationId(): string {
    return `${this.userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create reverse operation for undo/redo
  public createReverseOperation(operation: DragDropOperation): DragDropOperation {
    const reverseId = `reverse-${operation.id}`;
    const timestamp = new Date().toISOString();

    switch (operation.type) {
      case 'add':
        return {
          ...operation,
          id: reverseId,
          timestamp,
          type: 'delete',
          oldPosition: operation.newPosition,
          newPosition: undefined
        };

      case 'delete':
        return {
          ...operation,
          id: reverseId,
          timestamp,
          type: 'add',
          oldPosition: undefined,
          newPosition: operation.oldPosition
        };

      case 'move':
        return {
          ...operation,
          id: reverseId,
          timestamp,
          type: 'move',
          oldPosition: operation.newPosition,
          newPosition: operation.oldPosition
        };

      default:
        throw new Error(`Cannot create reverse operation for type: ${operation.type}`);
    }
  }

  // Batch operations for complex drag-drop scenarios
  public startBatch(): BatchOperationRecorder {
    return new BatchOperationRecorder(this);
  }
}

// Batch operation recorder for complex operations
export class BatchOperationRecorder {
  private operations: Omit<DragDropOperation, 'id' | 'timestamp' | 'userId' | 'userName'>[] = [];
  private manager: UndoRedoManager;

  constructor(manager: UndoRedoManager) {
    this.manager = manager;
  }

  public add(operation: Omit<DragDropOperation, 'id' | 'timestamp' | 'userId' | 'userName'>): void {
    this.operations.push(operation);
  }

  public commit(): void {
    // Record all operations as a single batch
    this.operations.forEach(operation => {
      this.manager.recordOperation(operation);
    });
    this.operations = [];
  }

  public cancel(): void {
    this.operations = [];
  }

  public getOperations(): Omit<DragDropOperation, 'id' | 'timestamp' | 'userId' | 'userName'>[] {
    return [...this.operations];
  }
}

export default UndoRedoManager;