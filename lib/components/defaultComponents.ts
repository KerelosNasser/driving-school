import { ComponentDefinition } from './types';

/**
 * Default component definitions for the component library
 */
export const DEFAULT_COMPONENTS: ComponentDefinition[] = [
  // Text Component
  {
    id: 'text',
    name: 'Text',
    category: 'text',
    icon: 'Type',
    description: 'Editable text content with formatting options',
    defaultProps: {
      text: 'Click to edit text...',
      fontSize: 'base',
      fontWeight: 'normal',
      textAlign: 'left',
      color: '#000000'
    },
    schema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          title: 'Text Content',
          description: 'The text to display'
        },
        fontSize: {
          type: 'string',
          title: 'Font Size',
          description: 'Size of the text',
          enum: ['sm', 'base', 'lg', 'xl', '2xl', '3xl'],
          default: 'base'
        },
        fontWeight: {
          type: 'string',
          title: 'Font Weight',
          description: 'Weight of the text',
          enum: ['normal', 'medium', 'semibold', 'bold'],
          default: 'normal'
        },
        textAlign: {
          type: 'string',
          title: 'Text Alignment',
          description: 'Alignment of the text',
          enum: ['left', 'center', 'right'],
          default: 'left'
        },
        color: {
          type: 'string',
          title: 'Text Color',
          description: 'Color of the text',
          format: 'color',
          default: '#000000'
        }
      },
      required: ['text']
    },
    previewComponent: 'TextComponentPreview',
    editComponent: 'TextComponentEdit',
    version: '1.0.0',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Image Component
  {
    id: 'image',
    name: 'Image',
    category: 'media',
    icon: 'Image',
    description: 'Image with upload and alt text editing capabilities',
    defaultProps: {
      src: '',
      alt: '',
      width: undefined,
      height: undefined,
      objectFit: 'cover',
      borderRadius: 'none'
    },
    schema: {
      type: 'object',
      properties: {
        src: {
          type: 'string',
          title: 'Image URL',
          description: 'URL of the image',
          format: 'url'
        },
        alt: {
          type: 'string',
          title: 'Alt Text',
          description: 'Alternative text for accessibility'
        },
        width: {
          type: 'number',
          title: 'Width',
          description: 'Width of the image in pixels'
        },
        height: {
          type: 'number',
          title: 'Height',
          description: 'Height of the image in pixels'
        },
        objectFit: {
          type: 'string',
          title: 'Object Fit',
          description: 'How the image should fit within its container',
          enum: ['contain', 'cover', 'fill', 'none', 'scale-down'],
          default: 'cover'
        },
        borderRadius: {
          type: 'string',
          title: 'Border Radius',
          description: 'Rounded corners of the image',
          enum: ['none', 'sm', 'md', 'lg', 'full'],
          default: 'none'
        }
      },
      required: ['alt']
    },
    previewComponent: 'ImageComponentPreview',
    editComponent: 'ImageComponentEdit',
    version: '1.0.0',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Section Component
  {
    id: 'section',
    name: 'Section',
    category: 'layout',
    icon: 'Layout',
    description: 'Container section with padding and background options',
    defaultProps: {
      backgroundColor: 'transparent',
      padding: 'md',
      margin: 'none',
      maxWidth: 'full'
    },
    schema: {
      type: 'object',
      properties: {
        backgroundColor: {
          type: 'string',
          title: 'Background Color',
          description: 'Background color of the section',
          format: 'color',
          default: 'transparent'
        },
        padding: {
          type: 'string',
          title: 'Padding',
          description: 'Internal spacing of the section',
          enum: ['none', 'sm', 'md', 'lg', 'xl'],
          default: 'md'
        },
        margin: {
          type: 'string',
          title: 'Margin',
          description: 'External spacing of the section',
          enum: ['none', 'sm', 'md', 'lg', 'xl'],
          default: 'none'
        },
        maxWidth: {
          type: 'string',
          title: 'Max Width',
          description: 'Maximum width constraint',
          enum: ['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'],
          default: 'full'
        }
      }
    },
    previewComponent: 'SectionComponentPreview',
    editComponent: 'SectionComponentEdit',
    version: '1.0.0',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Columns Component
  {
    id: 'columns',
    name: 'Columns',
    category: 'layout',
    icon: 'Columns',
    description: 'Multi-column layout with configurable spacing',
    defaultProps: {
      columns: 2,
      gap: 'md',
      alignItems: 'start'
    },
    schema: {
      type: 'object',
      properties: {
        columns: {
          type: 'number',
          title: 'Number of Columns',
          description: 'How many columns to display',
          enum: [1, 2, 3, 4, 6, 12],
          default: 2
        },
        gap: {
          type: 'string',
          title: 'Gap',
          description: 'Space between columns',
          enum: ['none', 'sm', 'md', 'lg', 'xl'],
          default: 'md'
        },
        alignItems: {
          type: 'string',
          title: 'Align Items',
          description: 'Vertical alignment of column content',
          enum: ['start', 'center', 'end', 'stretch'],
          default: 'start'
        }
      },
      required: ['columns']
    },
    previewComponent: 'ColumnComponentPreview',
    editComponent: 'ColumnComponentEdit',
    version: '1.0.0',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Row Component
  {
    id: 'row',
    name: 'Row',
    category: 'layout',
    icon: 'ArrowRight',
    description: 'Horizontal layout with flexible alignment options',
    defaultProps: {
      justifyContent: 'start',
      alignItems: 'center',
      gap: 'md',
      wrap: false
    },
    schema: {
      type: 'object',
      properties: {
        justifyContent: {
          type: 'string',
          title: 'Justify Content',
          description: 'Horizontal alignment of items',
          enum: ['start', 'center', 'end', 'between', 'around', 'evenly'],
          default: 'start'
        },
        alignItems: {
          type: 'string',
          title: 'Align Items',
          description: 'Vertical alignment of items',
          enum: ['start', 'center', 'end', 'stretch'],
          default: 'center'
        },
        gap: {
          type: 'string',
          title: 'Gap',
          description: 'Space between items',
          enum: ['none', 'sm', 'md', 'lg', 'xl'],
          default: 'md'
        },
        wrap: {
          type: 'boolean',
          title: 'Wrap',
          description: 'Allow items to wrap to next line',
          default: false
        }
      }
    },
    previewComponent: 'RowComponentPreview',
    editComponent: 'RowComponentEdit',
    version: '1.0.0',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Button Component
  {
    id: 'button',
    name: 'Button',
    category: 'interactive',
    icon: 'MousePointer',
    description: 'Interactive button with link and styling options',
    defaultProps: {
      text: 'Button Text',
      href: '',
      target: '_self',
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      disabled: false,
      icon: '',
      iconPosition: 'left'
    },
    schema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          title: 'Button Text',
          description: 'Text displayed on the button'
        },
        href: {
          type: 'string',
          title: 'Link URL',
          description: 'URL to navigate to when clicked',
          format: 'url'
        },
        target: {
          type: 'string',
          title: 'Link Target',
          description: 'How to open the link',
          enum: ['_self', '_blank', '_parent', '_top'],
          default: '_self'
        },
        variant: {
          type: 'string',
          title: 'Style Variant',
          description: 'Visual style of the button',
          enum: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
          default: 'primary'
        },
        size: {
          type: 'string',
          title: 'Size',
          description: 'Size of the button',
          enum: ['sm', 'md', 'lg', 'xl'],
          default: 'md'
        },
        fullWidth: {
          type: 'boolean',
          title: 'Full Width',
          description: 'Make button take full width of container',
          default: false
        },
        disabled: {
          type: 'boolean',
          title: 'Disabled',
          description: 'Disable button interaction',
          default: false
        },
        icon: {
          type: 'string',
          title: 'Icon',
          description: 'Icon to display with the button text'
        },
        iconPosition: {
          type: 'string',
          title: 'Icon Position',
          description: 'Position of the icon relative to text',
          enum: ['left', 'right'],
          default: 'left'
        }
      },
      required: ['text']
    },
    previewComponent: 'ButtonComponentPreview',
    editComponent: 'ButtonComponentEdit',
    version: '1.0.0',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];