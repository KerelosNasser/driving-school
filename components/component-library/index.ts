// Component Library - All component exports
export { TextComponentPreview, TextComponentEdit } from './TextComponent';
export { ImageComponentPreview, ImageComponentEdit } from './ImageComponent';
export { 
  SectionComponentPreview, 
  SectionComponentEdit,
  ColumnComponentPreview,
  ColumnComponentEdit,
  RowComponentPreview,
  RowComponentEdit
} from './LayoutComponents';
export { ButtonComponentPreview, ButtonComponentEdit } from './ButtonComponent';

// Component registration helper
import { ComponentRenderer } from '../../lib/components/ComponentRenderer';
import { 
  TextComponentPreview, 
  TextComponentEdit 
} from './TextComponent';
import { 
  ImageComponentPreview, 
  ImageComponentEdit 
} from './ImageComponent';
import { 
  SectionComponentPreview, 
  SectionComponentEdit,
  ColumnComponentPreview,
  ColumnComponentEdit,
  RowComponentPreview,
  RowComponentEdit
} from './LayoutComponents';
import { 
  ButtonComponentPreview, 
  ButtonComponentEdit 
} from './ButtonComponent';

/**
 * Register all component library React components with the renderer
 */
export function registerAllComponents(): void {
  // Text components
  ComponentRenderer.registerReactComponent('TextComponentPreview', TextComponentPreview);
  ComponentRenderer.registerReactComponent('TextComponentEdit', TextComponentEdit);

  // Image components
  ComponentRenderer.registerReactComponent('ImageComponentPreview', ImageComponentPreview);
  ComponentRenderer.registerReactComponent('ImageComponentEdit', ImageComponentEdit);

  // Layout components
  ComponentRenderer.registerReactComponent('SectionComponentPreview', SectionComponentPreview);
  ComponentRenderer.registerReactComponent('SectionComponentEdit', SectionComponentEdit);
  ComponentRenderer.registerReactComponent('ColumnComponentPreview', ColumnComponentPreview);
  ComponentRenderer.registerReactComponent('ColumnComponentEdit', ColumnComponentEdit);
  ComponentRenderer.registerReactComponent('RowComponentPreview', RowComponentPreview);
  ComponentRenderer.registerReactComponent('RowComponentEdit', RowComponentEdit);

  // Interactive components
  ComponentRenderer.registerReactComponent('ButtonComponentPreview', ButtonComponentPreview);
  ComponentRenderer.registerReactComponent('ButtonComponentEdit', ButtonComponentEdit);

  console.log('All component library React components registered');
}

/**
 * Initialize the complete component library
 */
export async function initializeComponentLibrary(): Promise<void> {
  const { componentRegistry } = await import('../../lib/components/ComponentRegistry');
  
  // Initialize the registry (loads default components)
  await componentRegistry.initialize();
  
  // Register React components
  registerAllComponents();
  
  console.log('Component library fully initialized');
}