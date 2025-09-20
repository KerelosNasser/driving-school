import React from 'react';
import { 
  ComponentDefinition, 
  ComponentInstance, 
  ComponentRenderContext 
} from './types';
import { componentRegistry } from './ComponentRegistry';

/**
 * Component Renderer - Handles rendering of component instances in preview and edit modes
 */
export class ComponentRenderer {
  private static componentMap: Map<string, React.ComponentType<any>> = new Map();

  /**
   * Register a React component for rendering
   */
  public static registerReactComponent(
    componentName: string, 
    component: React.ComponentType<any>
  ): void {
    this.componentMap.set(componentName, component);
    console.log(`Registered React component: ${componentName}`);
  }

  /**
   * Get a registered React component
   */
  public static getReactComponent(componentName: string): React.ComponentType<any> | undefined {
    return this.componentMap.get(componentName);
  }

  /**
   * Render a component instance in preview mode
   */
  public static renderPreview(
    instance: ComponentInstance,
    context: Partial<ComponentRenderContext> = {}
  ): React.ReactElement | null {
    const definition = componentRegistry.getDefinition(instance.type);
    if (!definition) {
      console.error(`Component definition not found: ${instance.type}`);
      return this.renderError(`Component type "${instance.type}" not found`);
    }

    const PreviewComponent = this.getReactComponent(definition.previewComponent);
    if (!PreviewComponent) {
      console.error(`Preview component not found: ${definition.previewComponent}`);
      return this.renderError(`Preview component "${definition.previewComponent}" not registered`);
    }

    const renderContext: ComponentRenderContext = {
      isEditMode: false,
      isPreview: true,
      componentId: instance.id,
      ...context
    };

    try {
      return React.createElement(PreviewComponent, {
        ...instance.props,
        ...renderContext,
        key: instance.id
      });
    } catch (error) {
      console.error(`Error rendering preview for ${instance.type}:`, error);
      return this.renderError(`Failed to render ${definition.name}`);
    }
  }

  /**
   * Render a component instance in edit mode
   */
  public static renderEdit(
    instance: ComponentInstance,
    context: Partial<ComponentRenderContext> = {}
  ): React.ReactElement | null {
    const definition = componentRegistry.getDefinition(instance.type);
    if (!definition) {
      console.error(`Component definition not found: ${instance.type}`);
      return this.renderError(`Component type "${instance.type}" not found`);
    }

    const EditComponent = this.getReactComponent(definition.editComponent);
    if (!EditComponent) {
      console.error(`Edit component not found: ${definition.editComponent}`);
      return this.renderError(`Edit component "${definition.editComponent}" not registered`);
    }

    const renderContext: ComponentRenderContext = {
      isEditMode: true,
      isPreview: false,
      componentId: instance.id,
      ...context
    };

    try {
      return React.createElement(EditComponent, {
        ...instance.props,
        ...renderContext,
        key: `edit-${instance.id}`
      });
    } catch (error) {
      console.error(`Error rendering edit mode for ${instance.type}:`, error);
      return this.renderError(`Failed to render ${definition.name} editor`);
    }
  }

  /**
   * Render a component based on context
   */
  public static render(
    instance: ComponentInstance,
    context: ComponentRenderContext
  ): React.ReactElement | null {
    if (context.isEditMode) {
      return this.renderEdit(instance, context);
    } else {
      return this.renderPreview(instance, context);
    }
  }

  /**
   * Render multiple component instances
   */
  public static renderMultiple(
    instances: ComponentInstance[],
    context: Partial<ComponentRenderContext> = {}
  ): React.ReactElement[] {
    return instances
      .filter(instance => instance.isActive)
      .sort((a, b) => a.position.order - b.position.order)
      .map(instance => {
        const instanceContext: ComponentRenderContext = {
          isEditMode: false,
          isPreview: true,
          componentId: instance.id,
          ...context
        };
        
        const rendered = this.render(instance, instanceContext);
        return rendered || this.renderError(`Failed to render ${instance.type}`);
      })
      .filter(Boolean);
  }

  /**
   * Render components for a specific page section
   */
  public static renderSection(
    pageId: string,
    sectionId: string,
    context: Partial<ComponentRenderContext> = {}
  ): React.ReactElement[] {
    const instances = componentRegistry.getInstancesForPage(pageId)
      .filter(instance => instance.position.sectionId === sectionId);

    return this.renderMultiple(instances, context);
  }

  /**
   * Create a component wrapper with editing capabilities
   */
  public static createEditableWrapper(
    instance: ComponentInstance,
    context: ComponentRenderContext
  ): React.ReactElement {
    const definition = componentRegistry.getDefinition(instance.type);
    const componentName = definition?.name || instance.type;

    // This would typically be a more sophisticated wrapper component
    // For now, we'll create a simple div wrapper
    const wrapperProps = {
      'data-component-id': instance.id,
      'data-component-type': instance.type,
      'data-editable': context.isEditMode,
      className: `component-wrapper ${context.isEditMode ? 'editable' : ''}`,
      style: {
        position: 'relative' as const,
        outline: context.isEditMode ? '2px dashed #3b82f6' : 'none',
        outlineOffset: '2px'
      }
    };

    const renderedComponent = this.render(instance, context);
    
    return React.createElement('div', wrapperProps, [
      // Edit mode toolbar
      context.isEditMode && React.createElement('div', {
        key: 'toolbar',
        className: 'component-toolbar',
        style: {
          position: 'absolute',
          top: '-30px',
          left: '0',
          background: '#3b82f6',
          color: 'white',
          padding: '4px 8px',
          fontSize: '12px',
          borderRadius: '4px',
          zIndex: 1000
        }
      }, componentName),
      
      // The actual component
      renderedComponent
    ]);
  }

  /**
   * Render error component
   */
  private static renderError(message: string): React.ReactElement {
    return React.createElement('div', {
      className: 'component-error',
      style: {
        padding: '16px',
        border: '2px dashed #ef4444',
        borderRadius: '8px',
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        textAlign: 'center' as const,
        fontSize: '14px'
      }
    }, [
      React.createElement('div', { key: 'icon', style: { marginBottom: '8px' } }, '⚠️'),
      React.createElement('div', { key: 'message' }, message)
    ]);
  }

  /**
   * Get all registered component names
   */
  public static getRegisteredComponents(): string[] {
    return Array.from(this.componentMap.keys());
  }

  /**
   * Check if a component is registered
   */
  public static isComponentRegistered(componentName: string): boolean {
    return this.componentMap.has(componentName);
  }

  /**
   * Clear all registered components (for testing)
   */
  public static clear(): void {
    this.componentMap.clear();
  }
}

// Export convenience functions
export const registerComponent = ComponentRenderer.registerReactComponent.bind(ComponentRenderer);
export const renderComponent = ComponentRenderer.render.bind(ComponentRenderer);
export const renderSection = ComponentRenderer.renderSection.bind(ComponentRenderer);