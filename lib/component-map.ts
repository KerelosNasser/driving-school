
import { 
  ButtonComponentPreview, 
  ButtonComponentEdit 
} from '@/components/component-library/ButtonComponent';
import { 
  ImageComponentPreview, 
  ImageComponentEdit 
} from '@/components/component-library/ImageComponent';
import { 
  TextComponentPreview, 
  TextComponentEdit 
} from '@/components/component-library/TextComponent';
import { 
  SectionComponentPreview, 
  SectionComponentEdit, 
  ColumnComponentPreview, 
  ColumnComponentEdit 
} from '@/components/component-library/LayoutComponents';
import { SectionComponent } from '@/components/component-library/SectionComponent';

export const componentMap = {
  'text-heading': {
    preview: TextComponentPreview,
    edit: TextComponentEdit,
  },
  'text-paragraph': {
    preview: TextComponentPreview,
    edit: TextComponentEdit,
  },
  'media-image': {
    preview: ImageComponentPreview,
    edit: ImageComponentEdit,
  },
  'layout-section': {
    preview: SectionComponent,
    edit: SectionComponent,
  },
  'layout-columns': {
    preview: ColumnComponentPreview,
    edit: ColumnComponentEdit,
  },
  'interactive-button': {
    preview: ButtonComponentPreview,
    edit: ButtonComponentEdit,
  },
};
