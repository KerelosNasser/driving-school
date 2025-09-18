// Theme preview system for safe testing and visualization
import { 
  Theme, 
  PreviewData, 
  ComponentPreview, 
  ComparisonData 
} from './types';

export interface PreviewSystem {
  generatePreview(theme: Theme): PreviewData;
  renderComponentPreviews(theme: Theme): ComponentPreview[];
  compareThemes(current: Theme, modified: Theme): ComparisonData;
  generateSideBySideComparison(current: Theme, modified: Theme): string;
  createPreviewContainer(theme: Theme): HTMLElement;
  updatePreviewInRealTime(theme: Theme, containerId: string): void;
  generateIsolatedPreview(theme: Theme): { html: string; css: string };
}

export class PreviewSystemImpl implements PreviewSystem {
  private previewContainers: Map<string, HTMLElement> = new Map();
  
  /**
   * Generate complete preview data for a theme
   */
  generatePreview(theme: Theme): PreviewData {
    const components = this.renderComponentPreviews(theme);
    
    return {
      html: this.generateFullPreviewHTML(components),
      css: this.generateFullPreviewCSS(theme, components),
      components
    };
  }

  /**
   * Render individual component previews
   */
  renderComponentPreviews(theme: Theme): ComponentPreview[] {
    return [
      this.generateHeroPreview(theme),
      this.generateCardPreview(theme),
      this.generateFormPreview(theme),
      this.generateButtonPreview(theme),
      this.generateNavigationPreview(theme)
    ];
  } 
 /**
   * Generate hero section preview
   */
  private generateHeroPreview(theme: Theme): ComponentPreview {
    const html = `
      <div class="preview-hero" data-component="hero">
        <div class="hero-background"></div>
        <div class="hero-content">
          <div class="hero-badge">
            <span>Professional Training</span>
          </div>
          <h1 class="hero-title">Learn to Drive with Confidence</h1>
          <p class="hero-subtitle">
            Expert instruction, modern vehicles, and flexible scheduling to help you become a safe, confident driver.
          </p>
          <div class="hero-actions">
            <button class="hero-btn-primary">Start Learning</button>
            <button class="hero-btn-secondary">View Courses</button>
          </div>
          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-number">500+</span>
              <span class="stat-label">Students Trained</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">98%</span>
              <span class="stat-label">Pass Rate</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">15+</span>
              <span class="stat-label">Years Experience</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const styles = this.generateHeroStyles(theme);

    return {
      component: 'hero',
      html,
      styles
    };
  }

  /**
   * Generate hero styles based on theme
   */
  private generateHeroStyles(theme: Theme): string {
    const heroGradient = theme.gradients.hero;
    const gradientCSS = this.buildGradientCSS(heroGradient);
    
    return `
      .preview-hero {
        position: relative;
        min-height: 500px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        overflow: hidden;
        border-radius: ${theme.effects.borderRadius.xl};
        margin-bottom: 2rem;
      }
      
      .hero-background {
        position: absolute;
        inset: 0;
        background: ${gradientCSS};
        opacity: 0.95;
      }
      
      .hero-content {
        position: relative;
        z-index: 10;
        text-align: center;
        max-width: 800px;
        color: white;
      }
      
      .hero-badge {
        display: inline-block;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: ${theme.effects.backdropBlur.sm};
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: ${theme.effects.borderRadius.full};
        padding: 0.5rem 1.5rem;
        margin-bottom: 1.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        font-family: ${theme.typography.fontFamily.sans.join(', ')};
      }
      
      .hero-title {
        font-size: 3.5rem;
        font-weight: ${theme.typography.fontWeight.bold};
        font-family: ${theme.typography.fontFamily.sans.join(', ')};
        line-height: ${theme.typography.lineHeight.tight};
        margin-bottom: 1.5rem;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .hero-subtitle {
        font-size: 1.25rem;
        line-height: ${theme.typography.lineHeight.relaxed};
        margin-bottom: 2.5rem;
        opacity: 0.9;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
      }
      
      .hero-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-bottom: 3rem;
        flex-wrap: wrap;
      }
      
      .hero-btn-primary {
        background: ${theme.colors.primary[500]};
        color: white;
        padding: 1rem 2rem;
        border: none;
        border-radius: ${theme.effects.borderRadius.lg};
        font-weight: ${theme.typography.fontWeight.semibold};
        font-size: 1rem;
        cursor: pointer;
        box-shadow: ${theme.effects.boxShadow.button};
        transition: all 0.2s ease;
      }
      
      .hero-btn-primary:hover {
        background: ${theme.colors.primary[600]};
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      }
      
      .hero-btn-secondary {
        background: transparent;
        color: white;
        padding: 1rem 2rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: ${theme.effects.borderRadius.lg};
        font-weight: ${theme.typography.fontWeight.semibold};
        font-size: 1rem;
        cursor: pointer;
        backdrop-filter: ${theme.effects.backdropBlur.sm};
        transition: all 0.2s ease;
      }
      
      .hero-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.5);
      }
      
      .hero-stats {
        display: flex;
        gap: 2rem;
        justify-content: center;
        flex-wrap: wrap;
      }
      
      .stat-item {
        text-align: center;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: ${theme.effects.backdropBlur.sm};
        border-radius: ${theme.effects.borderRadius.lg};
        padding: 1.5rem 1rem;
        min-width: 120px;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .stat-number {
        display: block;
        font-size: 2rem;
        font-weight: ${theme.typography.fontWeight.bold};
        margin-bottom: 0.25rem;
      }
      
      .stat-label {
        font-size: 0.875rem;
        opacity: 0.8;
      }
      
      @media (max-width: 768px) {
        .hero-title {
          font-size: 2.5rem;
        }
        
        .hero-actions {
          flex-direction: column;
          align-items: center;
        }
        
        .hero-stats {
          gap: 1rem;
        }
        
        .stat-item {
          min-width: 100px;
          padding: 1rem 0.75rem;
        }
      }
    `;
  } 
 /**
   * Generate card preview
   */
  private generateCardPreview(theme: Theme): ComponentPreview {
    const html = `
      <div class="preview-cards" data-component="card">
        <div class="card-container">
          <div class="preview-card featured">
            <div class="card-badge">Popular</div>
            <div class="card-icon">🚗</div>
            <h3 class="card-title">Standard Course</h3>
            <p class="card-description">
              Complete driving course with theory and practical lessons. Perfect for beginners.
            </p>
            <div class="card-features">
              <div class="feature-item">✓ 20 Practical Lessons</div>
              <div class="feature-item">✓ Theory Test Prep</div>
              <div class="feature-item">✓ Mock Driving Test</div>
            </div>
            <div class="card-price">
              <span class="price-amount">$599</span>
              <span class="price-period">Complete Package</span>
            </div>
            <button class="card-button">Choose Plan</button>
          </div>
          
          <div class="preview-card">
            <div class="card-icon">🏆</div>
            <h3 class="card-title">Intensive Course</h3>
            <p class="card-description">
              Fast-track program for quick learners. Get your license in just 2 weeks.
            </p>
            <div class="card-features">
              <div class="feature-item">✓ 30 Practical Lessons</div>
              <div class="feature-item">✓ Daily Sessions</div>
              <div class="feature-item">✓ Priority Booking</div>
            </div>
            <div class="card-price">
              <span class="price-amount">$899</span>
              <span class="price-period">2 Week Program</span>
            </div>
            <button class="card-button">Choose Plan</button>
          </div>
          
          <div class="preview-card">
            <div class="card-icon">📚</div>
            <h3 class="card-title">Refresher Course</h3>
            <p class="card-description">
              Perfect for experienced drivers who need to brush up on their skills.
            </p>
            <div class="card-features">
              <div class="feature-item">✓ 10 Practical Lessons</div>
              <div class="feature-item">✓ Flexible Schedule</div>
              <div class="feature-item">✓ Confidence Building</div>
            </div>
            <div class="card-price">
              <span class="price-amount">$299</span>
              <span class="price-period">Refresher Package</span>
            </div>
            <button class="card-button">Choose Plan</button>
          </div>
        </div>
      </div>
    `;

    const styles = this.generateCardStyles(theme);

    return {
      component: 'card',
      html,
      styles
    };
  }

  /**
   * Generate card styles based on theme
   */
  private generateCardStyles(theme: Theme): string {
    const cardGradient = theme.gradients.card;
    const gradientCSS = this.buildGradientCSS(cardGradient);
    
    return `
      .preview-cards {
        padding: 2rem 0;
      }
      
      .card-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
      }
      
      .preview-card {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: ${theme.effects.backdropBlur.md};
        border-radius: ${theme.effects.borderRadius.xl};
        padding: 2rem;
        box-shadow: ${theme.effects.boxShadow.card};
        border: 1px solid rgba(255, 255, 255, 0.2);
        position: relative;
        transition: all 0.3s ease;
      }
      
      .preview-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
      }
      
      .preview-card.featured {
        background: ${gradientCSS};
        color: white;
        transform: scale(1.05);
      }
      
      .preview-card.featured:hover {
        transform: scale(1.05) translateY(-8px);
      }
      
      .card-badge {
        position: absolute;
        top: -0.75rem;
        right: 1.5rem;
        background: ${theme.colors.accent[500]};
        color: white;
        padding: 0.5rem 1rem;
        border-radius: ${theme.effects.borderRadius.full};
        font-size: 0.875rem;
        font-weight: ${theme.typography.fontWeight.semibold};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      .card-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        display: block;
      }
      
      .card-title {
        font-size: 1.5rem;
        font-weight: ${theme.typography.fontWeight.bold};
        margin-bottom: 1rem;
        color: ${theme.colors.primary[900]};
        font-family: ${theme.typography.fontFamily.sans.join(', ')};
      }
      
      .preview-card.featured .card-title {
        color: white;
      }
      
      .card-description {
        color: ${theme.colors.neutral[600]};
        line-height: ${theme.typography.lineHeight.relaxed};
        margin-bottom: 1.5rem;
      }
      
      .preview-card.featured .card-description {
        color: rgba(255, 255, 255, 0.9);
      }
      
      .card-features {
        margin-bottom: 2rem;
      }
      
      .feature-item {
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        color: ${theme.colors.neutral[700]};
      }
      
      .preview-card.featured .feature-item {
        color: rgba(255, 255, 255, 0.9);
      }
      
      .card-price {
        margin-bottom: 1.5rem;
        text-align: center;
        padding: 1rem;
        background: rgba(0, 0, 0, 0.05);
        border-radius: ${theme.effects.borderRadius.lg};
      }
      
      .preview-card.featured .card-price {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .price-amount {
        display: block;
        font-size: 2rem;
        font-weight: ${theme.typography.fontWeight.bold};
        color: ${theme.colors.primary[600]};
        margin-bottom: 0.25rem;
      }
      
      .preview-card.featured .price-amount {
        color: white;
      }
      
      .price-period {
        font-size: 0.875rem;
        color: ${theme.colors.neutral[500]};
      }
      
      .preview-card.featured .price-period {
        color: rgba(255, 255, 255, 0.8);
      }
      
      .card-button {
        width: 100%;
        background: ${theme.colors.primary[600]};
        color: white;
        padding: 1rem;
        border: none;
        border-radius: ${theme.effects.borderRadius.lg};
        font-weight: ${theme.typography.fontWeight.semibold};
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 1rem;
      }
      
      .card-button:hover {
        background: ${theme.colors.primary[700]};
        transform: translateY(-2px);
      }
      
      .preview-card.featured .card-button {
        background: white;
        color: ${theme.colors.primary[600]};
      }
      
      .preview-card.featured .card-button:hover {
        background: rgba(255, 255, 255, 0.9);
      }
    `;
  } 
 /**
   * Generate form preview
   */
  private generateFormPreview(theme: Theme): ComponentPreview {
    const html = `
      <div class="preview-form" data-component="form">
        <div class="form-container">
          <div class="form-header">
            <h3 class="form-title">Book Your First Lesson</h3>
            <p class="form-subtitle">Get started with professional driving instruction</p>
          </div>
          
          <form class="contact-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">First Name</label>
                <input type="text" class="form-input" placeholder="Enter your first name" value="John">
              </div>
              <div class="form-group">
                <label class="form-label">Last Name</label>
                <input type="text" class="form-input" placeholder="Enter your last name" value="Doe">
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-input" placeholder="john.doe@example.com" value="john.doe@example.com">
            </div>
            
            <div class="form-group">
              <label class="form-label">Course Type</label>
              <select class="form-select">
                <option>Standard Course</option>
                <option selected>Intensive Course</option>
                <option>Refresher Course</option>
              </select>
            </div>
            
            <div class="form-actions">
              <button type="button" class="form-btn-secondary">Save Draft</button>
              <button type="submit" class="form-btn-primary">Book Lesson</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const styles = this.generateFormStyles(theme);

    return {
      component: 'form',
      html,
      styles
    };
  }

  /**
   * Generate form styles based on theme
   */
  private generateFormStyles(theme: Theme): string {
    return `
      .preview-form {
        padding: 2rem 0;
        background: linear-gradient(135deg, ${theme.colors.primary[50]}, ${theme.colors.secondary[50]});
        border-radius: ${theme.effects.borderRadius.xl};
      }
      
      .form-container {
        max-width: 600px;
        margin: 0 auto;
        padding: 0 2rem;
      }
      
      .form-header {
        text-align: center;
        margin-bottom: 2rem;
      }
      
      .form-title {
        font-size: 2rem;
        font-weight: ${theme.typography.fontWeight.bold};
        color: ${theme.colors.primary[900]};
        margin-bottom: 0.5rem;
        font-family: ${theme.typography.fontFamily.sans.join(', ')};
      }
      
      .form-subtitle {
        color: ${theme.colors.neutral[600]};
        font-size: 1.125rem;
      }
      
      .contact-form {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: ${theme.effects.backdropBlur.md};
        padding: 2rem;
        border-radius: ${theme.effects.borderRadius.xl};
        box-shadow: ${theme.effects.boxShadow.card};
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      
      .form-group {
        margin-bottom: 1.5rem;
      }
      
      .form-label {
        display: block;
        font-weight: ${theme.typography.fontWeight.medium};
        color: ${theme.colors.neutral[700]};
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .form-input,
      .form-select {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid ${theme.colors.neutral[200]};
        border-radius: ${theme.effects.borderRadius.lg};
        font-size: 1rem;
        transition: all 0.2s ease;
        background: white;
        font-family: ${theme.typography.fontFamily.sans.join(', ')};
      }
      
      .form-input:focus,
      .form-select:focus {
        outline: none;
        border-color: ${theme.colors.primary[500]};
        box-shadow: 0 0 0 3px ${theme.colors.primary[100]};
      }
      
      .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
        flex-wrap: wrap;
      }
      
      .form-btn-primary {
        background: ${theme.colors.primary[600]};
        color: white;
        padding: 0.875rem 2rem;
        border: none;
        border-radius: ${theme.effects.borderRadius.lg};
        font-weight: ${theme.typography.fontWeight.semibold};
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 1rem;
        box-shadow: ${theme.effects.boxShadow.button};
      }
      
      .form-btn-primary:hover {
        background: ${theme.colors.primary[700]};
        transform: translateY(-2px);
      }
      
      .form-btn-secondary {
        background: transparent;
        color: ${theme.colors.neutral[600]};
        padding: 0.875rem 2rem;
        border: 2px solid ${theme.colors.neutral[300]};
        border-radius: ${theme.effects.borderRadius.lg};
        font-weight: ${theme.typography.fontWeight.semibold};
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 1rem;
      }
      
      .form-btn-secondary:hover {
        background: ${theme.colors.neutral[50]};
        border-color: ${theme.colors.neutral[400]};
      }
      
      @media (max-width: 768px) {
        .form-row {
          grid-template-columns: 1fr;
        }
        
        .form-actions {
          flex-direction: column;
        }
      }
    `;
  }  /**

   * Generate button preview
   */
  private generateButtonPreview(theme: Theme): ComponentPreview {
    const html = `
      <div class="preview-buttons" data-component="button">
        <div class="button-section">
          <h4 class="section-title">Primary Buttons</h4>
          <div class="button-group">
            <button class="btn btn-primary btn-sm">Small</button>
            <button class="btn btn-primary btn-md">Medium</button>
            <button class="btn btn-primary btn-lg">Large</button>
          </div>
        </div>
        
        <div class="button-section">
          <h4 class="section-title">Secondary Buttons</h4>
          <div class="button-group">
            <button class="btn btn-secondary btn-sm">Small</button>
            <button class="btn btn-secondary btn-md">Medium</button>
            <button class="btn btn-secondary btn-lg">Large</button>
          </div>
        </div>
        
        <div class="button-section">
          <h4 class="section-title">Outline Buttons</h4>
          <div class="button-group">
            <button class="btn btn-outline btn-sm">Small</button>
            <button class="btn btn-outline btn-md">Medium</button>
            <button class="btn btn-outline btn-lg">Large</button>
          </div>
        </div>
      </div>
    `;

    const styles = this.generateButtonStyles(theme);

    return {
      component: 'button',
      html,
      styles
    };
  }

  /**
   * Generate button styles based on theme
   */
  private generateButtonStyles(theme: Theme): string {
    const buttonGradient = theme.gradients.button;
    const gradientCSS = this.buildGradientCSS(buttonGradient);
    
    return `
      .preview-buttons {
        padding: 2rem;
        background: linear-gradient(135deg, ${theme.colors.neutral[50]}, ${theme.colors.primary[50]});
        border-radius: ${theme.effects.borderRadius.xl};
      }
      
      .button-section {
        margin-bottom: 2rem;
      }
      
      .section-title {
        font-size: 1.125rem;
        font-weight: ${theme.typography.fontWeight.semibold};
        color: ${theme.colors.neutral[800]};
        margin-bottom: 1rem;
        font-family: ${theme.typography.fontFamily.sans.join(', ')};
      }
      
      .button-group {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        align-items: center;
      }
      
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-weight: ${theme.typography.fontWeight.semibold};
        text-align: center;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        font-family: ${theme.typography.fontFamily.sans.join(', ')};
      }
      
      .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        border-radius: ${theme.effects.borderRadius.md};
      }
      
      .btn-md {
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        border-radius: ${theme.effects.borderRadius.lg};
      }
      
      .btn-lg {
        padding: 1rem 2rem;
        font-size: 1.125rem;
        border-radius: ${theme.effects.borderRadius.lg};
      }
      
      .btn-primary {
        background: ${gradientCSS};
        color: white;
        box-shadow: ${theme.effects.boxShadow.button};
      }
      
      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      }
      
      .btn-secondary {
        background: ${theme.colors.secondary[500]};
        color: white;
        box-shadow: ${theme.effects.boxShadow.button};
      }
      
      .btn-secondary:hover {
        background: ${theme.colors.secondary[600]};
        transform: translateY(-2px);
      }
      
      .btn-outline {
        background: transparent;
        color: ${theme.colors.primary[600]};
        border: 2px solid ${theme.colors.primary[300]};
        box-shadow: none;
      }
      
      .btn-outline:hover {
        background: ${theme.colors.primary[50]};
        border-color: ${theme.colors.primary[500]};
        color: ${theme.colors.primary[700]};
      }
    `;
  }

  /**
   * Generate navigation preview
   */
  private generateNavigationPreview(theme: Theme): ComponentPreview {
    const html = `
      <div class="preview-navigation" data-component="navigation">
        <nav class="main-nav">
          <div class="nav-container">
            <div class="nav-brand">
              <span class="brand-icon">🚗</span>
              <span class="brand-text">DriveSchool</span>
            </div>
            
            <div class="nav-menu">
              <a href="#" class="nav-link active">Home</a>
              <a href="#" class="nav-link">Courses</a>
              <a href="#" class="nav-link">About</a>
              <a href="#" class="nav-link">Contact</a>
            </div>
            
            <div class="nav-actions">
              <button class="nav-btn-secondary">Login</button>
              <button class="nav-btn-primary">Book Now</button>
            </div>
          </div>
        </nav>
      </div>
    `;

    const styles = this.generateNavigationStyles(theme);

    return {
      component: 'navigation',
      html,
      styles
    };
  }

  /**
   * Generate navigation styles based on theme
   */
  private generateNavigationStyles(theme: Theme): string {
    const navGradient = theme.gradients.background;
    const gradientCSS = this.buildGradientCSS(navGradient);
    
    return `
      .preview-navigation {
        margin-bottom: 2rem;
      }
      
      .main-nav {
        background: ${gradientCSS};
        backdrop-filter: ${theme.effects.backdropBlur.md};
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        position: relative;
      }
      
      .nav-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .nav-brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: white;
        font-weight: ${theme.typography.fontWeight.bold};
        font-size: 1.25rem;
        font-family: ${theme.typography.fontFamily.sans.join(', ')};
      }
      
      .brand-icon {
        font-size: 1.5rem;
      }
      
      .nav-menu {
        display: flex;
        gap: 2rem;
        align-items: center;
      }
      
      .nav-link {
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;
        font-weight: ${theme.typography.fontWeight.medium};
        padding: 0.5rem 1rem;
        border-radius: ${theme.effects.borderRadius.lg};
        transition: all 0.2s ease;
      }
      
      .nav-link:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
      }
      
      .nav-link.active {
        color: white;
        background: rgba(255, 255, 255, 0.2);
      }
      
      .nav-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
      }
      
      .nav-btn-primary {
        background: ${theme.colors.primary[500]};
        color: white;
        padding: 0.5rem 1.5rem;
        border: none;
        border-radius: ${theme.effects.borderRadius.lg};
        font-weight: ${theme.typography.fontWeight.semibold};
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.875rem;
      }
      
      .nav-btn-primary:hover {
        background: ${theme.colors.primary[600]};
        transform: translateY(-1px);
      }
      
      .nav-btn-secondary {
        background: transparent;
        color: white;
        padding: 0.5rem 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: ${theme.effects.borderRadius.lg};
        font-weight: ${theme.typography.fontWeight.semibold};
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.875rem;
      }
      
      .nav-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.5);
      }
    `;
  }

  /**
   * Build CSS gradient string from gradient config
   */
  private buildGradientCSS(gradient: any): string {
    if (!gradient || !gradient.colorStops) {
      return 'linear-gradient(135deg, #10b981, #0891b2)'; // fallback
    }
    
    const stops = gradient.colorStops
      .map((stop: any) => `${stop.color} ${stop.position}%`)
      .join(', ');
    
    return `linear-gradient(${gradient.direction || '135deg'}, ${stops})`;
  }

  /**
   * Generate isolated preview for real-time updates
   */
  generateIsolatedPreview(theme: Theme): { html: string; css: string } {
    const components = this.renderComponentPreviews(theme);
    
    const html = `
      <div class="theme-preview-container">
        ${components.map(c => c.html).join('\n')}
      </div>
    `;
    
    const css = `
      .theme-preview-container {
        font-family: ${theme.typography.fontFamily.sans.join(', ')};
        line-height: ${theme.typography.lineHeight.normal};
        color: ${theme.colors.neutral[900]};
        background: linear-gradient(135deg, ${theme.colors.neutral[50]}, ${theme.colors.primary[50]});
        min-height: 100%;
        padding: 2rem;
      }
      
      * {
        box-sizing: border-box;
      }
      
      ${components.map(c => c.styles).join('\n')}
    `;
    
    return { html, css };
  }

  /**
   * Generate full preview HTML combining all components
   */
  private generateFullPreviewHTML(components: ComponentPreview[]): string {
    return `
      <div class="theme-preview-container">
        ${components.map(c => c.html).join('\n')}
      </div>
    `;
  }

  /**
   * Generate full preview CSS combining all component styles
   */
  private generateFullPreviewCSS(theme: Theme, components: ComponentPreview[]): string {
    const baseStyles = `
      .theme-preview-container {
        font-family: ${theme.typography.fontFamily.sans.join(', ')};
        line-height: ${theme.typography.lineHeight.normal};
        color: ${theme.colors.neutral[900]};
        background: linear-gradient(135deg, ${theme.colors.neutral[50]}, ${theme.colors.primary[50]});
        min-height: 100vh;
        padding: 2rem;
      }
      
      * {
        box-sizing: border-box;
      }
      
      button {
        font-family: inherit;
      }
      
      input, select, textarea {
        font-family: inherit;
      }
    `;
    
    const componentStyles = components.map(c => c.styles).join('\n');
    
    return baseStyles + '\n' + componentStyles;
  }

  /**
   * Compare two themes and generate comparison data
   */
  compareThemes(current: Theme, modified: Theme): ComparisonData {
    const differences: string[] = [];

    // Compare colors
    this.compareColorPalettes(current.colors, modified.colors, differences);
    
    // Compare gradients
    this.compareGradients(current.gradients, modified.gradients, differences);
    
    // Compare typography
    this.compareTypography(current.typography, modified.typography, differences);
    
    // Compare effects
    this.compareEffects(current.effects, modified.effects, differences);

    return {
      current,
      modified,
      differences
    };
  }

  /**
   * Compare color palettes and add differences
   */
  private compareColorPalettes(current: any, modified: any, differences: string[]): void {
    const scales = ['primary', 'secondary', 'accent', 'neutral'];
    
    scales.forEach(scale => {
      if (current[scale] && modified[scale]) {
        Object.keys(current[scale]).forEach(shade => {
          if (current[scale][shade] !== modified[scale][shade]) {
            differences.push(`Color ${scale}-${shade}: ${current[scale][shade]} → ${modified[scale][shade]}`);
          }
        });
      }
    });

    // Compare semantic colors
    if (current.semantic && modified.semantic) {
      Object.keys(current.semantic).forEach(key => {
        if (current.semantic[key] !== modified.semantic[key]) {
          differences.push(`Semantic ${key}: ${current.semantic[key]} → ${modified.semantic[key]}`);
        }
      });
    }
  }

  /**
   * Compare gradients and add differences
   */
  private compareGradients(current: any, modified: any, differences: string[]): void {
    Object.keys(current).forEach(key => {
      const currentGradient = JSON.stringify(current[key]);
      const modifiedGradient = JSON.stringify(modified[key]);
      
      if (currentGradient !== modifiedGradient) {
        differences.push(`Gradient ${key}: Modified`);
      }
    });
  }

  /**
   * Compare typography and add differences
   */
  private compareTypography(current: any, modified: any, differences: string[]): void {
    // Compare font families
    ['sans', 'serif', 'mono'].forEach(family => {
      const currentFamily = JSON.stringify(current.fontFamily[family]);
      const modifiedFamily = JSON.stringify(modified.fontFamily[family]);
      
      if (currentFamily !== modifiedFamily) {
        differences.push(`Font family ${family}: Modified`);
      }
    });

    // Compare font sizes
    Object.keys(current.fontSize).forEach(size => {
      if (current.fontSize[size] !== modified.fontSize[size]) {
        differences.push(`Font size ${size}: ${current.fontSize[size]} → ${modified.fontSize[size]}`);
      }
    });
  }

  /**
   * Compare effects and add differences
   */
  private compareEffects(current: any, modified: any, differences: string[]): void {
    const effectTypes = ['backdropBlur', 'boxShadow', 'borderRadius'];
    
    effectTypes.forEach(type => {
      if (current[type] && modified[type]) {
        Object.keys(current[type]).forEach(size => {
          if (current[type][size] !== modified[type][size]) {
            differences.push(`${type} ${size}: ${current[type][size]} → ${modified[type][size]}`);
          }
        });
      }
    });
  }

  /**
   * Generate side-by-side comparison HTML
   */
  generateSideBySideComparison(current: Theme, modified: Theme): string {
    const currentPreview = this.generatePreview(current);
    const modifiedPreview = this.generatePreview(modified);
    const comparison = this.compareThemes(current, modified);

    return `
      <div class="theme-comparison">
        <div class="comparison-header">
          <h3>Theme Comparison</h3>
          <div class="comparison-summary">
            <span class="changes-count">${comparison.differences.length} changes detected</span>
          </div>
        </div>
        
        <div class="comparison-content">
          <div class="comparison-side">
            <h4>Current Theme: ${current.name}</h4>
            <div class="preview-container current-preview">
              <style>${currentPreview.css}</style>
              ${currentPreview.html}
            </div>
          </div>
          
          <div class="comparison-divider">
            <div class="divider-line"></div>
            <span class="divider-text">VS</span>
            <div class="divider-line"></div>
          </div>
          
          <div class="comparison-side">
            <h4>Modified Theme: ${modified.name}</h4>
            <div class="preview-container modified-preview">
              <style>${modifiedPreview.css}</style>
              ${modifiedPreview.html}
            </div>
          </div>
        </div>
        
        <div class="comparison-changes">
          <h4>Changes Summary</h4>
          <ul class="changes-list">
            ${comparison.differences.map(diff => `<li class="change-item">${diff}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Create a preview container element
   */
  createPreviewContainer(theme: Theme): HTMLElement {
    if (typeof window === 'undefined') {
      throw new Error('Preview container can only be created in browser environment');
    }

    const container = document.createElement('div');
    container.className = 'theme-preview-container';
    container.id = `preview-${theme.id}-${Date.now()}`;
    
    const preview = this.generatePreview(theme);
    
    // Add styles
    const styleElement = document.createElement('style');
    styleElement.textContent = preview.css;
    container.appendChild(styleElement);
    
    // Add HTML content
    const contentElement = document.createElement('div');
    contentElement.innerHTML = preview.html;
    container.appendChild(contentElement);
    
    // Store reference
    this.previewContainers.set(container.id, container);
    
    return container;
  }

  /**
   * Update preview in real-time
   */
  updatePreviewInRealTime(theme: Theme, containerId: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Preview container ${containerId} not found`);
      return;
    }

    const preview = this.generatePreview(theme);
    
    // Update styles
    const styleElement = container.querySelector('style');
    if (styleElement) {
      styleElement.textContent = preview.css;
    }
    
    // Update content
    const contentElement = container.querySelector('div');
    if (contentElement) {
      contentElement.innerHTML = preview.html;
    }
  }

  /**
   * Clean up preview containers
   */
  cleanup(): void {
    this.previewContainers.clear();
  }
}

// Export singleton instance
export const previewSystem = new PreviewSystemImpl();