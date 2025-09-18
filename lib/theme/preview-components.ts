// Additional preview components for the theme preview system
import { Theme, ComponentPreview } from './types';

export class PreviewComponents {
  /**
   * Generate form preview
   */
  static generateFormPreview(theme: Theme): ComponentPreview {
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
              <label class="form-label">Phone Number</label>
              <input type="tel" class="form-input" placeholder="+1 (555) 123-4567" value="+1 (555) 123-4567">
            </div>
            
            <div class="form-group">
              <label class="form-label">Course Type</label>
              <select class="form-select">
                <option>Standard Course</option>
                <option selected>Intensive Course</option>
                <option>Refresher Course</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Preferred Schedule</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" class="form-checkbox" checked>
                  <span class="checkbox-text">Weekdays</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" class="form-checkbox">
                  <span class="checkbox-text">Weekends</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" class="form-checkbox" checked>
                  <span class="checkbox-text">Evenings</span>
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Additional Notes</label>
              <textarea class="form-textarea" placeholder="Any specific requirements or questions..." rows="4">I'm a complete beginner and would like to start with basic vehicle controls.</textarea>
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
  private static generateFormStyles(theme: Theme): string {
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
      .form-select,
      .form-textarea {
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
      .form-select:focus,
      .form-textarea:focus {
        outline: none;
        border-color: ${theme.colors.primary[500]};
        box-shadow: 0 0 0 3px ${theme.colors.primary[100]};
      }
      
      .form-select {
        cursor: pointer;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
        padding-right: 2.5rem;
      }
      
      .checkbox-group {
        display: flex;
        gap: 1.5rem;
        flex-wrap: wrap;
      }
      
      .checkbox-label {
        display: flex;
        align-items: center;
        cursor: pointer;
        font-weight: ${theme.typography.fontWeight.normal};
      }
      
      .form-checkbox {
        width: 1.25rem;
        height: 1.25rem;
        margin-right: 0.5rem;
        accent-color: ${theme.colors.primary[500]};
      }
      
      .checkbox-text {
        color: ${theme.colors.neutral[700]};
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
        
        .checkbox-group {
          flex-direction: column;
          gap: 0.75rem;
        }
      }
    `;
  }

  /**
   * Generate button preview
   */
  static generateButtonPreview(theme: Theme): ComponentPreview {
    const html = `
      <div class="preview-buttons" data-component="button">
        <div class="button-section">
          <h4 class="section-title">Primary Buttons</h4>
          <div class="button-group">
            <button class="btn btn-primary btn-sm">Small</button>
            <button class="btn btn-primary btn-md">Medium</button>
            <button class="btn btn-primary btn-lg">Large</button>
            <button class="btn btn-primary btn-md" disabled>Disabled</button>
          </div>
        </div>
        
        <div class="button-section">
          <h4 class="section-title">Secondary Buttons</h4>
          <div class="button-group">
            <button class="btn btn-secondary btn-sm">Small</button>
            <button class="btn btn-secondary btn-md">Medium</button>
            <button class="btn btn-secondary btn-lg">Large</button>
            <button class="btn btn-secondary btn-md" disabled>Disabled</button>
          </div>
        </div>
        
        <div class="button-section">
          <h4 class="section-title">Outline Buttons</h4>
          <div class="button-group">
            <button class="btn btn-outline btn-sm">Small</button>
            <button class="btn btn-outline btn-md">Medium</button>
            <button class="btn btn-outline btn-lg">Large</button>
            <button class="btn btn-outline btn-md" disabled>Disabled</button>
          </div>
        </div>
        
        <div class="button-section">
          <h4 class="section-title">Ghost Buttons</h4>
          <div class="button-group">
            <button class="btn btn-ghost btn-sm">Small</button>
            <button class="btn btn-ghost btn-md">Medium</button>
            <button class="btn btn-ghost btn-lg">Large</button>
            <button class="btn btn-ghost btn-md" disabled>Disabled</button>
          </div>
        </div>
        
        <div class="button-section">
          <h4 class="section-title">Icon Buttons</h4>
          <div class="button-group">
            <button class="btn btn-primary btn-md">
              <span class="btn-icon">📞</span>
              Call Now
            </button>
            <button class="btn btn-secondary btn-md">
              <span class="btn-icon">📧</span>
              Email Us
            </button>
            <button class="btn btn-outline btn-md">
              Download
              <span class="btn-icon">⬇️</span>
            </button>
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
  private static generateButtonStyles(theme: Theme): string {
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
        position: relative;
        overflow: hidden;
      }
      
      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
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
      
      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      }
      
      .btn-secondary {
        background: ${theme.colors.secondary[500]};
        color: white;
        box-shadow: ${theme.effects.boxShadow.button};
      }
      
      .btn-secondary:hover:not(:disabled) {
        background: ${theme.colors.secondary[600]};
        transform: translateY(-2px);
      }
      
      .btn-outline {
        background: transparent;
        color: ${theme.colors.primary[600]};
        border: 2px solid ${theme.colors.primary[300]};
        box-shadow: none;
      }
      
      .btn-outline:hover:not(:disabled) {
        background: ${theme.colors.primary[50]};
        border-color: ${theme.colors.primary[500]};
        color: ${theme.colors.primary[700]};
      }
      
      .btn-ghost {
        background: transparent;
        color: ${theme.colors.neutral[600]};
        box-shadow: none;
      }
      
      .btn-ghost:hover:not(:disabled) {
        background: ${theme.colors.neutral[100]};
        color: ${theme.colors.neutral[800]};
      }
      
      .btn-icon {
        font-size: 1em;
        line-height: 1;
      }
      
      @media (max-width: 768px) {
        .button-group {
          flex-direction: column;
          align-items: stretch;
        }
        
        .btn {
          width: 100%;
        }
      }
    `;
  }

  /**
   * Build CSS gradient string from gradient config
   */
  private static buildGradientCSS(gradient: any): string {
    if (!gradient || !gradient.colorStops) {
      return 'linear-gradient(135deg, #10b981, #0891b2)'; // fallback
    }
    
    const stops = gradient.colorStops
      .map((stop: any) => `${stop.color} ${stop.position}%`)
      .join(', ');
    
    return `linear-gradient(${gradient.direction || '135deg'}, ${stops})`;
  }
}