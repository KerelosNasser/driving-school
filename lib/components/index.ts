// Component library infrastructure exports
export * from './types';
export { ComponentRegistryManager, componentRegistry } from './ComponentRegistry';
export { ComponentValidator } from './ComponentValidator';
export { ComponentRenderer, registerComponent, renderComponent, renderSection } from './ComponentRenderer';
export { ComponentPositioning } from './ComponentPositioning';
export { PositionManager, positionManager } from './PositionManager';

// Re-export realtime types that are used by components
export type { ComponentPosition } from '../realtime/types';

// Utility functions
export function initializeComponentLibrary(): Promise<void> {
  return componentRegistry.initialize();
}

export function createComponent(
  componentType: string,
  props: Record<string, any> = {},
  userId: string
) {
  return componentRegistry.createInstance(componentType, props, userId);
}

export function getComponent(instanceId: string) {
  return componentRegistry.getInstance(instanceId);
}

export function updateComponent(
  instanceId: string,
  updates: Record<string, any>,
  userId: string
) {
  const instance = componentRegistry.getInstance(instanceId);
  if (!instance) {
    throw new Error(`Component instance not found: ${instanceId}`);
  }

  return componentRegistry.updateInstance(instanceId, { props: updates }, userId);
}

export function deleteComponent(instanceId: string): boolean {
  return componentRegistry.deleteInstance(instanceId);
}

export function getPageComponents(pageId: string) {
  return componentRegistry.getInstancesForPage(pageId);
}

export function getComponentDefinitions(category?: string) {
  return componentRegistry.getDefinitions(category);
}

export function getComponentDefinitionsByCategory() {
  return componentRegistry.getDefinitionsByCategory();
}

// Position management functions
export function moveComponent(
  componentId: string,
  newPosition: ComponentPosition,
  userId: string,
  eventRouter?: any
) {
  return positionManager.moveComponent(componentId, newPosition, userId, eventRouter);
}

export function insertComponent(
  componentId: string,
  position: ComponentPosition,
  userId: string,
  eventRouter?: any
) {
  return positionManager.insertComponent(componentId, position, userId, eventRouter);
}

export function removeComponent(
  componentId: string,
  userId: string,
  eventRouter?: any
) {
  return positionManager.removeComponent(componentId, userId, eventRouter);
}

export function reorderComponents(
  componentIds: string[],
  sectionId: string,
  pageId: string,
  parentId: string | undefined,
  userId: string,
  eventRouter?: any
) {
  return positionManager.reorderComponents(componentIds, sectionId, pageId, parentId, userId, eventRouter);
}

export function getComponentHierarchy(pageId: string) {
  return positionManager.getHierarchy(pageId);
}

export function getPositionStats(pageId: string) {
  return positionManager.getPositionStats(pageId);
}

export function getNextOrder(pageId: string, sectionId: string, parentId?: string) {
  return ComponentPositioning.getNextOrder(pageId, sectionId, parentId);
}

export function validatePosition(position: ComponentPosition) {
  return ComponentPositioning.validatePosition(position);
}

export function canMoveToParent(componentId: string, newParentId: string | undefined, pageId: string) {
  return ComponentPositioning.canMoveToParent(componentId, newParentId, pageId);
}

// Component library status
export function getLibraryStatus() {
  return {
    definitionsCount: componentRegistry.definitions.size,
    instancesCount: componentRegistry.instances.size,
    registeredComponents: ComponentRenderer.getRegisteredComponents(),
    categories: componentRegistry.getDefinitionsByCategory()
  };
}