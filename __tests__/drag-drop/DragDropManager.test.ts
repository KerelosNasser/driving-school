import { DragDropManager } from '../../lib/drag-drop/DragDropManager';
import { DragItem, DropZone } from '../../lib/types/drag-drop';

describe('DragDropManager', () => {
  let manager: DragDropManager;

  beforeEach(() => {
    manager = DragDropManager.getInstance();
  });

  afterEach(() => {
    manager.destroy();
  });

  test('should be a singleton', () => {
    const manager1 = DragDropManager.getInstance();
    const manager2 = DragDropManager.getInstance();
    expect(manager1).toBe(manager2);
  });

  test('should handle drag start events', () => {
    const mockListener = jest.fn();
    manager.onDragStart(mockListener);

    const dragItem: DragItem = {
      type: 'new_component',
      componentType: 'text',
      preview: { name: 'Text Component', icon: '📝' }
    };

    manager.handleDragStart(dragItem, 'user1', 'John Doe');

    expect(mockListener).toHaveBeenCalledWith({
      userId: 'user1',
      userName: 'John Doe',
      item: dragItem,
      timestamp: expect.any(String)
    });
  });

  test('should handle drag end events', () => {
    const mockListener = jest.fn();
    manager.onDragEnd(mockListener);

    const dragItem: DragItem = {
      type: 'new_component',
      componentType: 'text'
    };

    const dropResult = { success: true };
    manager.handleDragEnd(dragItem, dropResult, 'user1', 'John Doe');

    expect(mockListener).toHaveBeenCalledWith({
      userId: 'user1',
      userName: 'John Doe',
      item: dragItem,
      dropResult,
      timestamp: expect.any(String)
    });
  });

  test('should register and unregister drop zones', () => {
    const dropZone: DropZone = {
      id: 'zone1',
      type: 'section',
      accepts: ['new_component'],
      position: { pageId: 'home', sectionId: 'main', order: 0 },
      isActive: false,
      isValid: true
    };

    manager.registerDropZone(dropZone);
    expect(manager.getActiveZones()).toContain(dropZone);

    manager.unregisterDropZone('zone1');
    expect(manager.getActiveZones()).not.toContain(dropZone);
  });

  test('should validate drops correctly', () => {
    const dragItem: DragItem = {
      type: 'new_component',
      componentType: 'text'
    };

    const validZone: DropZone = {
      id: 'zone1',
      type: 'section',
      accepts: ['new_component'],
      position: { pageId: 'home', sectionId: 'main', order: 0 },
      isActive: false,
      isValid: true
    };

    const invalidZone: DropZone = {
      id: 'zone2',
      type: 'section',
      accepts: ['existing_component'],
      position: { pageId: 'home', sectionId: 'sidebar', order: 0 },
      isActive: false,
      isValid: true
    };

    const validResult = manager.validateDrop(dragItem, validZone);
    expect(validResult.canDrop).toBe(true);

    const invalidResult = manager.validateDrop(dragItem, invalidZone);
    expect(invalidResult.canDrop).toBe(false);
  });

  test('should track current drag state', () => {
    expect(manager.isDragging()).toBe(false);
    expect(manager.getCurrentDragItem()).toBe(null);

    const dragItem: DragItem = {
      type: 'new_component',
      componentType: 'text'
    };

    manager.handleDragStart(dragItem, 'user1', 'John Doe');
    expect(manager.isDragging()).toBe(true);
    expect(manager.getCurrentDragItem()).toBe(dragItem);

    manager.handleDragEnd(dragItem, null, 'user1', 'John Doe');
    expect(manager.isDragging()).toBe(false);
    expect(manager.getCurrentDragItem()).toBe(null);
  });
});