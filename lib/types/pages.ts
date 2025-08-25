// Modern Page Management Types - Following 2025 best practices

export interface PageBlock {
  id: string;
  type: string;
  props: Record<string, any>;
  styles: Record<string, any>;
}

export interface PageContent {
  blocks: PageBlock[];
}

export interface PageMetaData {
  title?: string;
  description: string;
  keywords: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_card?: 'summary' | 'summary_large_image';
  canonical?: string;
  robots_index?: boolean;
  robots_follow?: boolean;
  schema_type?: 'WebPage' | 'Article' | 'Service' | 'LocalBusiness' | 'EducationalOrganization' | 'AboutPage' | 'ContactPage';
}

export interface PageSettings {
  layout: 'default' | 'full-width' | 'narrow';
  show_header: boolean;
  show_footer: boolean;
  allow_comments?: boolean;
  featured?: boolean;
  custom_css?: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: PageContent;
  meta_data: PageMetaData;
  status: 'draft' | 'published' | 'archived';
  settings: PageSettings;
  created_at: string;
  updated_at: string;
  published_at?: string;
  author_id?: string;
}

export interface ComponentTemplate {
  id: string;
  name: string;
  category: 'headers' | 'content' | 'media' | 'layout' | 'marketing' | 'forms';
  icon: string;
  description: string;
  template: {
    type: string;
    props: Record<string, any>;
    styles: Record<string, any>;
  };
  preview_image?: string;
  is_system: boolean;
  usage_count: number;
  created_at: string;
}

export interface PageRevision {
  id: string;
  page_id: string;
  content: PageContent;
  meta_data: PageMetaData;
  settings: PageSettings;
  created_at: string;
  author_id?: string;
  revision_note?: string;
}

// API Response types
export interface PagesResponse {
  pages: Page[];
  total: number;
  page: number;
  limit: number;
}

export interface ComponentTemplatesResponse {
  templates: ComponentTemplate[];
  categories: Record<string, ComponentTemplate[]>;
}

// Create/Update request types
export interface CreatePageRequest {
  title: string;
  slug: string;
  content?: PageContent;
  meta_data?: Partial<PageMetaData>;
  settings?: Partial<PageSettings>;
  status?: Page['status'];
}

export interface UpdatePageRequest {
  title?: string;
  slug?: string;
  content?: PageContent;
  meta_data?: Partial<PageMetaData>;
  settings?: Partial<PageSettings>;
  status?: Page['status'];
}

export interface CreateComponentTemplateRequest {
  name: string;
  category: ComponentTemplate['category'];
  icon: string;
  description: string;
  template: ComponentTemplate['template'];
  preview_image?: string;
}

// Editor state types
export interface EditorState {
  selectedBlockId: string | null;
  isEditing: boolean;
  isDragging: boolean;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  showGrid: boolean;
}

export interface BlockPosition {
  index: number;
  blockId: string;
}

export interface DragResult {
  source: BlockPosition;
  destination: BlockPosition | null;
}

// Utility types
export type PageStatus = Page['status'];
export type ComponentCategory = ComponentTemplate['category'];
export type PreviewMode = EditorState['previewMode'];