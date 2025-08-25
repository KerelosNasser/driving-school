// SEO Utilities - Advanced SEO Functions and Helpers
'use client';

import type { Page } from '@/lib/types/pages';

// SEO Score Calculator
export interface SEOFactors {
  title: {
    present: boolean;
    length: number;
    keywordPresent: boolean;
    optimal: boolean;
  };
  description: {
    present: boolean;
    length: number;
    keywordPresent: boolean;
    optimal: boolean;
  };
  content: {
    length: number;
    hasH1: boolean;
    hasH2: boolean;
    keywordDensity: number;
    optimal: boolean;
  };
  technical: {
    hasStructuredData: boolean;
    hasOpenGraph: boolean;
    hasTwitterCard: boolean;
    hasCanonical: boolean;
  };
  keywords: {
    present: boolean;
    count: number;
    relevance: number;
  };
}

export interface SEOAnalysisResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: SEOFactors;
  recommendations: SEORecommendation[];
  warnings: SEOWarning[];
  opportunities: SEOOpportunity[];
}

export interface SEORecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'medium' | 'hard';
  category: 'content' | 'technical' | 'meta' | 'structure';
}

export interface SEOWarning {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  fix: string;
}

export interface SEOOpportunity {
  id: string;
  title: string;
  description: string;
  potentialGain: number;
  category: string;
}

// Main SEO Analysis Function
export function analyzePage(page: Page, focusKeywords: string[] = []): SEOAnalysisResult {
  const factors = calculateSEOFactors(page, focusKeywords);
  const score = calculateSEOScore(factors);
  const grade = getGradeFromScore(score);
  const recommendations = generateRecommendations(factors, page);
  const warnings = generateWarnings(factors, page);
  const opportunities = generateOpportunities(factors, page);

  return {
    score,
    grade,
    factors,
    recommendations,
    warnings,
    opportunities
  };
}

// Calculate individual SEO factors
function calculateSEOFactors(page: Page, focusKeywords: string[]): SEOFactors {
  const title = page.meta_data?.title || page.title || '';
  const description = page.meta_data?.description || '';
  const content = extractTextFromBlocks(page.content?.blocks || []);
  const keywords = page.meta_data?.keywords || '';

  return {
    title: analyzeTitleSEO(title, focusKeywords),
    description: analyzeDescriptionSEO(description, focusKeywords),
    content: analyzeContentSEO(content, page.content?.blocks || [], focusKeywords),
    technical: analyzeTechnicalSEO(page),
    keywords: analyzeKeywordsSEO(keywords, focusKeywords)
  };
}

// Title Analysis
function analyzeTitleSEO(title: string, focusKeywords: string[]) {
  const length = title.length;
  const present = length > 0;
  const keywordPresent = focusKeywords.some(keyword => 
    title.toLowerCase().includes(keyword.toLowerCase())
  );
  const optimal = length >= 30 && length <= 60;

  return {
    present,
    length,
    keywordPresent,
    optimal
  };
}

// Meta Description Analysis
function analyzeDescriptionSEO(description: string, focusKeywords: string[]) {
  const length = description.length;
  const present = length > 0;
  const keywordPresent = focusKeywords.some(keyword => 
    description.toLowerCase().includes(keyword.toLowerCase())
  );
  const optimal = length >= 120 && length <= 160;

  return {
    present,
    length,
    keywordPresent,
    optimal
  };
}

// Content Analysis
function analyzeContentSEO(content: string, blocks: any[], focusKeywords: string[]) {
  const length = content.length;
  const hasH1 = blocks.some(block => 
    block.type === 'text' && block.props?.content?.includes('<h1>')
  );
  const hasH2 = blocks.some(block => 
    block.type === 'text' && block.props?.content?.includes('<h2>')
  );
  
  const keywordDensity = calculateKeywordDensity(content, focusKeywords);
  const optimal = length >= 300 && hasH1 && keywordDensity > 0 && keywordDensity < 3;

  return {
    length,
    hasH1,
    hasH2,
    keywordDensity,
    optimal
  };
}

// Technical SEO Analysis
function analyzeTechnicalSEO(page: Page) {
  const hasStructuredData = !!page.meta_data?.schema_type;
  const hasOpenGraph = !!(page.meta_data?.og_title || page.meta_data?.og_description);
  const hasTwitterCard = !!page.meta_data?.twitter_card;
  const hasCanonical = !!page.meta_data?.canonical;

  return {
    hasStructuredData,
    hasOpenGraph,
    hasTwitterCard,
    hasCanonical
  };
}

// Keywords Analysis
function analyzeKeywordsSEO(keywords: string, focusKeywords: string[]) {
  const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
  const present = keywordList.length > 0;
  const count = keywordList.length;
  const relevance = calculateKeywordRelevance(keywordList, focusKeywords);

  return {
    present,
    count,
    relevance
  };
}

// Calculate overall SEO score
function calculateSEOScore(factors: SEOFactors): number {
  let score = 0;
  const weights = {
    title: 25,
    description: 15,
    content: 30,
    technical: 20,
    keywords: 10
  };

  // Title score
  if (factors.title.present) score += 10;
  if (factors.title.optimal) score += 10;
  if (factors.title.keywordPresent) score += 5;

  // Description score
  if (factors.description.present) score += 8;
  if (factors.description.optimal) score += 5;
  if (factors.description.keywordPresent) score += 2;

  // Content score
  if (factors.content.length >= 300) score += 15;
  if (factors.content.hasH1) score += 10;
  if (factors.content.hasH2) score += 3;
  if (factors.content.keywordDensity > 0 && factors.content.keywordDensity < 3) score += 2;

  // Technical score
  if (factors.technical.hasStructuredData) score += 5;
  if (factors.technical.hasOpenGraph) score += 8;
  if (factors.technical.hasTwitterCard) score += 3;
  if (factors.technical.hasCanonical) score += 4;

  // Keywords score
  if (factors.keywords.present) score += 5;
  if (factors.keywords.count >= 3 && factors.keywords.count <= 7) score += 3;
  if (factors.keywords.relevance > 0.5) score += 2;

  return Math.min(100, score);
}

// Generate recommendations
function generateRecommendations(factors: SEOFactors, page: Page): SEORecommendation[] {
  const recommendations: SEORecommendation[] = [];

  if (!factors.title.present) {
    recommendations.push({
      id: 'missing-title',
      title: 'Add Page Title',
      description: 'Every page needs a descriptive title for search engines.',
      impact: 'high',
      effort: 'easy',
      category: 'meta'
    });
  } else if (!factors.title.optimal) {
    recommendations.push({
      id: 'optimize-title-length',
      title: 'Optimize Title Length',
      description: 'Keep your title between 30-60 characters for optimal display in search results.',
      impact: 'medium',
      effort: 'easy',
      category: 'meta'
    });
  }

  if (!factors.description.present) {
    recommendations.push({
      id: 'add-meta-description',
      title: 'Add Meta Description',
      description: 'Meta descriptions help search engines understand your page and improve click-through rates.',
      impact: 'high',
      effort: 'easy',
      category: 'meta'
    });
  }

  if (!factors.content.hasH1) {
    recommendations.push({
      id: 'add-h1-tag',
      title: 'Add H1 Heading',
      description: 'Every page should have exactly one H1 tag that describes the main topic.',
      impact: 'high',
      effort: 'easy',
      category: 'structure'
    });
  }

  if (factors.content.length < 300) {
    recommendations.push({
      id: 'increase-content-length',
      title: 'Add More Content',
      description: 'Pages with more substantial content (300+ words) tend to rank better in search results.',
      impact: 'medium',
      effort: 'medium',
      category: 'content'
    });
  }

  if (!factors.technical.hasOpenGraph) {
    recommendations.push({
      id: 'add-open-graph',
      title: 'Add Open Graph Tags',
      description: 'Open Graph tags improve how your page appears when shared on social media.',
      impact: 'medium',
      effort: 'easy',
      category: 'technical'
    });
  }

  if (!factors.technical.hasStructuredData) {
    recommendations.push({
      id: 'add-structured-data',
      title: 'Add Structured Data',
      description: 'Structured data helps search engines understand your content better.',
      impact: 'medium',
      effort: 'medium',
      category: 'technical'
    });
  }

  return recommendations;
}

// Generate warnings
function generateWarnings(factors: SEOFactors, page: Page): SEOWarning[] {
  const warnings: SEOWarning[] = [];

  if (factors.title.length > 60) {
    warnings.push({
      id: 'title-too-long',
      title: 'Title Too Long',
      description: `Your title is ${factors.title.length} characters. It may be truncated in search results.`,
      severity: 'warning',
      fix: 'Shorten your title to 60 characters or less.'
    });
  }

  if (factors.description.length > 160) {
    warnings.push({
      id: 'description-too-long',
      title: 'Meta Description Too Long',
      description: `Your meta description is ${factors.description.length} characters and may be truncated.`,
      severity: 'warning',
      fix: 'Shorten your meta description to 160 characters or less.'
    });
  }

  if (factors.content.keywordDensity > 3) {
    warnings.push({
      id: 'keyword-stuffing',
      title: 'Potential Keyword Stuffing',
      description: 'Your keyword density is too high and may be penalized by search engines.',
      severity: 'critical',
      fix: 'Reduce keyword usage and focus on natural, readable content.'
    });
  }

  return warnings;
}

// Generate opportunities
function generateOpportunities(factors: SEOFactors, page: Page): SEOOpportunity[] {
  const opportunities: SEOOpportunity[] = [];

  if (!factors.content.hasH2) {
    opportunities.push({
      id: 'add-h2-headings',
      title: 'Add H2 Subheadings',
      description: 'H2 tags help organize content and provide additional keyword opportunities.',
      potentialGain: 5,
      category: 'structure'
    });
  }

  if (!factors.technical.hasCanonical) {
    opportunities.push({
      id: 'add-canonical-url',
      title: 'Add Canonical URL',
      description: 'Canonical URLs prevent duplicate content issues and consolidate page authority.',
      potentialGain: 8,
      category: 'technical'
    });
  }

  if (factors.keywords.count < 3) {
    opportunities.push({
      id: 'expand-keywords',
      title: 'Add More Target Keywords',
      description: 'Target 3-7 relevant keywords to capture more search traffic.',
      potentialGain: 10,
      category: 'content'
    });
  }

  return opportunities;
}

// Helper functions
function extractTextFromBlocks(blocks: any[]): string {
  return blocks
    .filter(block => block.type === 'text')
    .map(block => block.props?.content || '')
    .join(' ')
    .replace(/<[^>]*>/g, ''); // Remove HTML tags
}

function calculateKeywordDensity(content: string, keywords: string[]): number {
  if (!keywords.length || !content.length) return 0;
  
  const words = content.toLowerCase().split(/\s+/);
  const totalWords = words.length;
  
  let keywordCount = 0;
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
    const matches = content.toLowerCase().match(regex);
    keywordCount += matches ? matches.length : 0;
  });
  
  return totalWords > 0 ? (keywordCount / totalWords) * 100 : 0;
}

function calculateKeywordRelevance(keywords: string[], focusKeywords: string[]): number {
  if (!focusKeywords.length) return 0;
  
  let relevantCount = 0;
  keywords.forEach(keyword => {
    if (focusKeywords.some(focus => 
      keyword.toLowerCase().includes(focus.toLowerCase()) ||
      focus.toLowerCase().includes(keyword.toLowerCase())
    )) {
      relevantCount++;
    }
  });
  
  return keywords.length > 0 ? relevantCount / keywords.length : 0;
}

function getGradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// SEO Content Optimization Helpers
export function optimizeTitle(title: string, keyword: string): string {
  if (!title.toLowerCase().includes(keyword.toLowerCase())) {
    return `${keyword} | ${title}`;
  }
  return title;
}

export function generateMetaDescription(content: string, keyword: string, maxLength: number = 160): string {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let description = '';
  
  // Try to include keyword in first sentence
  const keywordSentence = sentences.find(s => 
    s.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (keywordSentence) {
    description = keywordSentence.trim();
  } else {
    description = sentences[0]?.trim() || '';
  }
  
  // Truncate if too long
  if (description.length > maxLength) {
    description = description.substring(0, maxLength - 3) + '...';
  }
  
  return description;
}

export function suggestKeywords(content: string, title: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const words = text.match(/\b\w{4,}\b/g) || [];
  
  // Count word frequency
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  // Filter and sort by frequency
  return Object.entries(frequency)
    .filter(([word, count]) => count >= 2 && !isStopWord(word))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

function isStopWord(word: string): boolean {
  const stopWords = [
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'between', 'among', 'throughout', 'despite',
    'towards', 'upon', 'concerning', 'to', 'in', 'for', 'on', 'by', 'about',
    'like', 'through', 'over', 'before', 'between', 'after', 'since',
    'without', 'under', 'within', 'along', 'following', 'across', 'behind',
    'beyond', 'plus', 'except', 'but', 'up', 'out', 'around', 'down',
    'off', 'above', 'near'
  ];
  
  return stopWords.includes(word.toLowerCase());
}

// URL and Slug Optimization
export function optimizeSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Image SEO Optimization
export function optimizeImageAlt(imageSrc: string, pageTitle: string, keyword: string): string {
  const fileName = imageSrc.split('/').pop()?.split('.')[0] || '';
  const cleanFileName = fileName.replace(/[-_]/g, ' ').toLowerCase();
  
  if (keyword && !cleanFileName.includes(keyword.toLowerCase())) {
    return `${keyword} - ${pageTitle}`;
  }
  
  return cleanFileName || pageTitle;
}

// Schema.org Helpers
export function generateBreadcrumbSchema(breadcrumbs: Array<{name: string, url: string}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function generateFAQSchema(faqs: Array<{question: string, answer: string}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}