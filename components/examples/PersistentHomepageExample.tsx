'use client';

import { PersistentEditableText } from '@/components/ui/persistent-editable-text';
import { useEditMode } from '@/contexts/editModeContext';

/**
 * Example implementation showing how to use PersistentEditableText
 * This replaces hardcoded content with persistent, editable content
 * 
 * Before: <h1>Welcome to EG Driving School</h1>
 * After: <PersistentEditableText contentKey="hero_title" defaultValue="Welcome to EG Driving School" tagName="h1" />
 */
export function PersistentHomepageExample() {
  const { isEditMode } = useEditMode();

  return (
    <div className="min-h-screen">
      {/* Hero Section with Persistent Content */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          {/* Editable Hero Title */}
          <PersistentEditableText
            contentKey="hero_title"
            pageName="home"
            defaultValue="Professional Driving Lessons in Brisbane"
            tagName="h1"
            className="text-5xl font-bold mb-6"
            showHistory={true}
          />
          
          {/* Editable Hero Subtitle */}
          <PersistentEditableText
            contentKey="hero_subtitle"
            pageName="home"
            defaultValue="Learn to drive with confidence from Queensland's most experienced instructors"
            tagName="p"
            className="text-xl mb-8 max-w-2xl mx-auto"
            multiline={true}
            maxLength={200}
          />
          
          {/* Editable Call-to-Action Button Text */}
          <button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition-colors">
            <PersistentEditableText
              contentKey="hero_cta_text"
              pageName="home"
              defaultValue="Start Learning Today"
              tagName="span"
            />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <PersistentEditableText
              contentKey="features_title"
              pageName="home"
              defaultValue="Why Choose EG Driving School?"
              tagName="h2"
              className="text-3xl font-bold text-gray-900 mb-4"
            />
            
            <PersistentEditableText
              contentKey="features_subtitle"
              pageName="home"
              defaultValue="We provide comprehensive driving education with personalized instruction"
              tagName="p"
              className="text-lg text-gray-600 max-w-2xl mx-auto"
              multiline={true}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🚗</span>
              </div>
              <PersistentEditableText
                contentKey="feature_1_title"
                pageName="home"
                defaultValue="Modern Vehicles"
                tagName="h3"
                className="text-xl font-semibold mb-2"
              />
              <PersistentEditableText
                contentKey="feature_1_description"
                pageName="home"
                defaultValue="Learn in well-maintained, modern vehicles equipped with dual controls for safety"
                tagName="p"
                className="text-gray-600"
                multiline={true}
              />
            </div>
            
            {/* Feature 2 */}
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">👨‍🏫</span>
              </div>
              <PersistentEditableText
                contentKey="feature_2_title"
                pageName="home"
                defaultValue="Expert Instructors"
                tagName="h3"
                className="text-xl font-semibold mb-2"
              />
              <PersistentEditableText
                contentKey="feature_2_description"
                pageName="home"
                defaultValue="Qualified instructors with years of experience and high pass rates"
                tagName="p"
                className="text-gray-600"
                multiline={true}
              />
            </div>
            
            {/* Feature 3 */}
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <PersistentEditableText
                contentKey="feature_3_title"
                pageName="home"
                defaultValue="Flexible Scheduling"
                tagName="h3"
                className="text-xl font-semibold mb-2"
              />
              <PersistentEditableText
                contentKey="feature_3_description"
                pageName="home"
                defaultValue="Book lessons at times that work for you, including evenings and weekends"
                tagName="p"
                className="text-gray-600"
                multiline={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Instructor Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <PersistentEditableText
              contentKey="instructor_section_title"
              pageName="home"
              defaultValue="Meet Your Instructor"
              tagName="h2"
              className="text-3xl font-bold text-gray-900 mb-8"
            />
          </div>
          
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-48 h-48 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
                <span className="text-6xl">👨‍🏫</span>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <PersistentEditableText
                  contentKey="instructor_name"
                  pageName="home"
                  defaultValue="Emael Ghobrial"
                  tagName="h3"
                  className="text-2xl font-bold text-gray-900 mb-2"
                />
                
                <PersistentEditableText
                  contentKey="instructor_title"
                  pageName="home"
                  defaultValue="Senior Driving Instructor"
                  tagName="p"
                  className="text-blue-600 font-semibold mb-4"
                />
                
                <PersistentEditableText
                  contentKey="instructor_bio"
                  pageName="home"
                  defaultValue="With over 15 years of teaching experience, Emael has helped thousands of students become confident, safe drivers. His patient teaching approach and in-depth knowledge of Queensland road rules ensure you get the best possible preparation for your driving test."
                  tagName="p"
                  className="text-gray-600 mb-4"
                  multiline={true}
                  maxLength={500}
                />
                
                <div className="flex flex-col sm:flex-row gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">⭐</span>
                    <PersistentEditableText
                      contentKey="instructor_rating"
                      pageName="home"
                      defaultValue="4.9/5 Rating"
                      tagName="span"
                      className="text-gray-700"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <PersistentEditableText
                      contentKey="instructor_experience"
                      pageName="home"
                      defaultValue="2000+ Students Passed"
                      tagName="span"
                      className="text-gray-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Edit Mode Indicators */}
      {isEditMode && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Edit Mode Active</span>
          </div>
          <p className="text-xs mt-1 opacity-90">Click any text to edit • Changes save automatically</p>
        </div>
      )}
      
      {/* Loading indicator for content */}
      <style jsx global>{`
        .editable-element:hover {
          background-color: rgba(59, 130, 246, 0.1) !important;
          outline: 1px dashed rgba(59, 130, 246, 0.5);
        }
        .editable-element.editing {
          background-color: rgba(59, 130, 246, 0.1) !important;
          outline: 2px solid #3b82f6;
        }
      `}</style>
    </div>
  );
}

/**
 * Usage Instructions:
 * 
 * 1. Replace your existing homepage with this component
 * 2. Ensure the database schema is set up (run content-versioning.sql)
 * 3. All content will load from database or use defaults
 * 4. Changes persist across server restarts
 * 5. Edit history is maintained automatically
 * 
 * Migration Path:
 * - Identify hardcoded text in existing components
 * - Replace with PersistentEditableText components
 * - Use meaningful contentKey names
 * - Set appropriate defaultValues
 */
