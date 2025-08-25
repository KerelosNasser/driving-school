'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Save, 
  Calendar,
  FileText,
  Tag,
  User,
  Filter,
  Copy,
  Car
} from 'lucide-react';
import { toast } from 'sonner';

// Content types
interface ContentItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  type: 'page' | 'post' | 'lesson' | 'instructor' | 'testimonial';
  status: 'published' | 'draft' | 'scheduled' | 'private';
  author: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  featuredImage?: string;
  categories: string[];
  tags: string[];
  seo: {
    title?: string;
    description?: string;
    keywords?: string;
  };
  customFields?: Record<string, any>;
}

interface ContentType {
  id: string;
  name: string;
  slug: string;
  icon: any;
  description: string;
  fields: ContentField[];
  supports: string[];
}

interface ContentField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'url' | 'date' | 'select' | 'checkbox' | 'file';
  label: string;
  required: boolean;
  options?: string[];
}

// Predefined content types
const contentTypes: ContentType[] = [
  {
    id: 'page',
    name: 'Pages',
    slug: 'pages',
    icon: FileText,
    description: 'Static pages like About, Contact, etc.',
    fields: [],
    supports: ['title', 'content', 'excerpt', 'featured-image', 'seo']
  },
  {
    id: 'post',
    name: 'Blog Posts',
    slug: 'posts',
    icon: Edit,
    description: 'Blog articles and news posts',
    fields: [],
    supports: ['title', 'content', 'excerpt', 'featured-image', 'categories', 'tags', 'seo']
  },
  {
    id: 'lesson',
    name: 'Driving Lessons',
    slug: 'lessons',
    icon: Car,
    description: 'Different types of driving lessons offered',
    fields: [
      {
        id: 'duration',
        name: 'duration',
        type: 'number',
        label: 'Duration (hours)',
        required: true
      },
      {
        id: 'price',
        name: 'price',
        type: 'number',
        label: 'Price ($)',
        required: true
      },
      {
        id: 'difficulty',
        name: 'difficulty',
        type: 'select',
        label: 'Difficulty Level',
        required: true,
        options: ['Beginner', 'Intermediate', 'Advanced']
      }
    ],
    supports: ['title', 'content', 'featured-image', 'seo']
  },
  {
    id: 'instructor',
    name: 'Instructors',
    slug: 'instructors',
    icon: User,
    description: 'Driving instructor profiles',
    fields: [
      {
        id: 'experience',
        name: 'experience',
        type: 'number',
        label: 'Years of Experience',
        required: true
      },
      {
        id: 'specialties',
        name: 'specialties',
        type: 'textarea',
        label: 'Specialties',
        required: false
      },
      {
        id: 'phone',
        name: 'phone',
        type: 'text',
        label: 'Phone Number',
        required: false
      },
      {
        id: 'email',
        name: 'email',
        type: 'email',
        label: 'Email',
        required: false
      }
    ],
    supports: ['title', 'content', 'featured-image', 'seo']
  }
];

export function ContentManager() {
  const [activeContentType, setActiveContentType] = useState('page');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Initialize with demo data
  useEffect(() => {
    const demoContent: ContentItem[] = [
      {
        id: '1',
        title: 'About EG Driving School',
        slug: 'about',
        content: 'We are Brisbane\'s premier driving school with over 10 years of experience helping students pass their driving tests.',
        excerpt: 'Learn about our driving school and experienced instructors.',
        type: 'page',
        status: 'published',
        author: 'Admin',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        categories: [],
        tags: [],
        seo: {
          title: 'About Us - EG Driving School',
          description: 'Learn about Brisbane\'s premier driving school with experienced instructors.',
          keywords: 'driving school, about us, Brisbane, instructors'
        }
      },
      {
        id: '2',
        title: 'How to Prepare for Your Driving Test',
        slug: 'driving-test-preparation',
        content: 'Here are essential tips to help you prepare for your driving test and pass on the first attempt.',
        excerpt: 'Essential tips for passing your driving test on the first try.',
        type: 'post',
        status: 'published',
        author: 'Admin',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        categories: ['Tips', 'Driving Test'],
        tags: ['preparation', 'test', 'driving'],
        seo: {
          title: 'How to Prepare for Your Driving Test - EG Driving School',
          description: 'Essential tips to help you prepare and pass your driving test on the first attempt.',
          keywords: 'driving test, preparation, tips, pass'
        }
      },
      {
        id: '3',
        title: 'Standard Driving Lesson',
        slug: 'standard-lesson',
        content: 'Our standard 1-hour driving lesson covers basic driving skills and road rules.',
        type: 'lesson',
        status: 'published',
        author: 'Admin',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        categories: [],
        tags: ['lesson', 'standard'],
        seo: {},
        customFields: {
          duration: 1,
          price: 65,
          difficulty: 'Beginner'
        }
      }
    ];

    setContentItems(demoContent);
  }, []);

  // Filter content items
  const filteredItems = contentItems.filter(item => {
    const matchesType = item.type === activeContentType;
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesType && matchesSearch && matchesStatus;
  });

  // Create new content item
  const createNewItem = useCallback(() => {
    const newItem: ContentItem = {
      id: `item_${Date.now()}`,
      title: 'New ' + contentTypes.find(ct => ct.id === activeContentType)?.name.slice(0, -1) || 'Item',
      slug: '',
      content: '',
      excerpt: '',
      type: activeContentType as ContentItem['type'],
      status: 'draft',
      author: 'Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      categories: [],
      tags: [],
      seo: {},
      customFields: {}
    };
    
    setSelectedItem(newItem);
    setIsEditing(true);
  }, [activeContentType]);

  // Save content item
  const saveItem = useCallback(async (item: ContentItem) => {
    setLoading(true);
    try {
      // Generate slug from title if empty
      if (!item.slug && item.title) {
        item.slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      
      item.updatedAt = new Date().toISOString();
      
      if (item.status === 'published' && !item.publishedAt) {
        item.publishedAt = new Date().toISOString();
      }

      // Update or add item
      setContentItems(prev => {
        const exists = prev.find(i => i.id === item.id);
        if (exists) {
          return prev.map(i => i.id === item.id ? item : i);
        } else {
          return [...prev, item];
        }
      });

      setIsEditing(false);
      toast.success('Content saved successfully');
    } catch (error) {
      toast.error('Failed to save content'+error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete content item
  const deleteItem = useCallback((itemId: string) => {
    setContentItems(prev => prev.filter(item => item.id !== itemId));
    if (selectedItem?.id === itemId) {
      setSelectedItem(null);
      setIsEditing(false);
    }
    toast.success('Content deleted');
  }, [selectedItem]);

  // Duplicate content item
  const duplicateItem = useCallback((item: ContentItem) => {
    const duplicated: ContentItem = {
      ...item,
      id: `item_${Date.now()}`,
      title: item.title + ' (Copy)',
      slug: item.slug + '-copy',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: undefined
    };
    
    setContentItems(prev => [...prev, duplicated]);
    toast.success('Content duplicated');
  }, []);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'private': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render content editor
  const renderContentEditor = () => {
    if (!selectedItem) return null;

    const currentContentType = contentTypes.find(ct => ct.id === selectedItem.type);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Edit' : 'View'} {currentContentType?.name.slice(0, -1)}
          </h2>
          <div className="flex space-x-2">
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {isEditing && (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={() => saveItem(selectedItem)} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </>
            )}
          </div>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={selectedItem.title}
                onChange={(e) => setSelectedItem(prev => prev ? {...prev, title: e.target.value} : null)}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Slug</Label>
              <Input
                value={selectedItem.slug}
                onChange={(e) => setSelectedItem(prev => prev ? {...prev, slug: e.target.value} : null)}
                disabled={!isEditing}
                className="mt-1"
                placeholder="url-friendly-name"
              />
            </div>
            
            {currentContentType?.supports.includes('excerpt') && (
              <div>
                <Label>Excerpt</Label>
                <Textarea
                  value={selectedItem.excerpt || ''}
                  onChange={(e) => setSelectedItem(prev => prev ? {...prev, excerpt: e.target.value} : null)}
                  disabled={!isEditing}
                  className="mt-1"
                  rows={2}
                />
              </div>
            )}
            
            <div>
              <Label>Content</Label>
              <Textarea
                value={selectedItem.content}
                onChange={(e) => setSelectedItem(prev => prev ? {...prev, content: e.target.value} : null)}
                disabled={!isEditing}
                className="mt-1"
                rows={8}
              />
            </div>
            
            {/* Custom fields for specific content types */}
            {currentContentType?.fields.map(field => (
              <div key={field.id}>
                <Label>{field.label}{field.required && ' *'}</Label>
                {field.type === 'select' ? (
                  <select
                    value={selectedItem.customFields?.[field.name] || ''}
                    onChange={(e) => setSelectedItem(prev => prev ? {
                      ...prev,
                      customFields: { ...prev.customFields, [field.name]: e.target.value }
                    } : null)}
                    disabled={!isEditing}
                    className="w-full p-2 border rounded mt-1"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <Textarea
                    value={selectedItem.customFields?.[field.name] || ''}
                    onChange={(e) => setSelectedItem(prev => prev ? {
                      ...prev,
                      customFields: { ...prev.customFields, [field.name]: e.target.value }
                    } : null)}
                    disabled={!isEditing}
                    className="mt-1"
                    rows={3}
                  />
                ) : (
                  <Input
                    type={field.type}
                    value={selectedItem.customFields?.[field.name] || ''}
                    onChange={(e) => setSelectedItem(prev => prev ? {
                      ...prev,
                      customFields: { 
                        ...prev.customFields, 
                        [field.name]: field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value 
                      }
                    } : null)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                )}
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div>
              <Label>Status</Label>
              <select
                value={selectedItem.status}
                onChange={(e) => setSelectedItem(prev => prev ? {...prev, status: e.target.value as ContentItem['status']} : null)}
                disabled={!isEditing}
                className="w-full p-2 border rounded mt-1"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="private">Private</option>
              </select>
            </div>
            
            {currentContentType?.supports.includes('categories') && (
              <div>
                <Label>Categories</Label>
                <Input
                  value={selectedItem.categories.join(', ')}
                  onChange={(e) => setSelectedItem(prev => prev ? {
                    ...prev, 
                    categories: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                  } : null)}
                  disabled={!isEditing}
                  className="mt-1"
                  placeholder="Category 1, Category 2"
                />
              </div>
            )}
            
            {currentContentType?.supports.includes('tags') && (
              <div>
                <Label>Tags</Label>
                <Input
                  value={selectedItem.tags.join(', ')}
                  onChange={(e) => setSelectedItem(prev => prev ? {
                    ...prev, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  } : null)}
                  disabled={!isEditing}
                  className="mt-1"
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="seo" className="space-y-4">
            <div>
              <Label>SEO Title</Label>
              <Input
                value={selectedItem.seo.title || ''}
                onChange={(e) => setSelectedItem(prev => prev ? {
                  ...prev, 
                  seo: { ...prev.seo, title: e.target.value }
                } : null)}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>SEO Description</Label>
              <Textarea
                value={selectedItem.seo.description || ''}
                onChange={(e) => setSelectedItem(prev => prev ? {
                  ...prev, 
                  seo: { ...prev.seo, description: e.target.value }
                } : null)}
                disabled={!isEditing}
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div>
              <Label>Keywords</Label>
              <Input
                value={selectedItem.seo.keywords || ''}
                onChange={(e) => setSelectedItem(prev => prev ? {
                  ...prev, 
                  seo: { ...prev.seo, keywords: e.target.value }
                } : null)}
                disabled={!isEditing}
                className="mt-1"
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Content Manager</span>
          </CardTitle>
          <CardDescription>
            Create and manage pages, posts, and custom content
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeContentType} onValueChange={setActiveContentType}>
            <TabsList className="grid w-full grid-cols-4">
              {contentTypes.map(type => {
                const IconComponent = type.icon;
                return (
                  <TabsTrigger key={type.id} value={type.id} className="flex items-center space-x-2">
                    <IconComponent className="h-4 w-4" />
                    <span>{type.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {contentTypes.map(type => (
              <TabsContent key={type.id} value={type.id} className="space-y-4">
                {/* Content List */}
                <div className="space-y-4">
                  {/* Toolbar */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button onClick={createNewItem}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New {type.name.slice(0, -1)}
                      </Button>
                      
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder={`Search ${type.name.toLowerCase()}...`}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border rounded px-3 py-1 text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Content Items */}
                  <div className="grid gap-4">
                    {filteredItems.map(item => (
                      <Card 
                        key={item.id} 
                        className={`cursor-pointer transition-all ${
                          selectedItem?.id === item.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-medium">{item.title}</h3>
                                <Badge className={getStatusColor(item.status)}>
                                  {item.status}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {item.excerpt || item.content.substring(0, 150) + '...'}
                              </p>
                              
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {new Date(item.updatedAt).toLocaleDateString()}
                                </span>
                                <span className="flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  {item.author}
                                </span>
                                {item.categories.length > 0 && (
                                  <span className="flex items-center">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {item.categories.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/${item.slug}`, '_blank');
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateItem(item);
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteItem(item.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {filteredItems.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No {type.name.toLowerCase()} found</p>
                        <Button variant="outline" className="mt-4" onClick={createNewItem}>
                          Create your first {type.name.slice(0, -1).toLowerCase()}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Content Editor */}
      {selectedItem && (
        <Card>
          <CardContent className="p-6">
            {renderContentEditor()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}