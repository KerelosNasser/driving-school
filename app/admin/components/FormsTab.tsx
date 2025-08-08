'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const FormsTab = () => {
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const handleCreateForm = async () => {
    // In a real application, you would make an API call to your backend to create the Google Form.
    // This is a placeholder to simulate the functionality.
    alert(`Creating form with title: ${formTitle}`);
    // Here you would typically call a serverless function or an API route that uses the Google Forms API.
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Forms Integration</CardTitle>
        <CardDescription>Create and manage Google Forms for your students</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="formTitle" className="block text-sm font-medium text-gray-700">Form Title</label>
            <Input 
              id="formTitle"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g., Student Feedback Form"
            />
          </div>
          <div>
            <label htmlFor="formDescription" className="block text-sm font-medium text-gray-700">Form Description</label>
            <Input 
              id="formDescription"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="e.g., A short description of the form"
            />
          </div>
          <Button onClick={handleCreateForm}>Create Form</Button>
        </div>
      </CardContent>
    </Card>
  );
};