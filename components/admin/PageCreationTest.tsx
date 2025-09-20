'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function PageCreationTest() {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testPageCreation = async () => {
    setIsCreating(true);
    setResult(null);

    try {
      const testData = {
        title: 'Test Page',
        urlSlug: 'test-page-' + Date.now(),
        template: 'basic',
        navigationOrder: 0,
        isVisible: true
      };

      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      setResult(data);
      toast.success('Test page created successfully!');
    } catch (error) {
      console.error('Test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult({ error: errorMessage });
      toast.error(`Test failed: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Page Creation API Test</CardTitle>
        <CardDescription>
          Test the page creation API endpoint to verify it's working correctly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testPageCreation} 
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? 'Creating Test Page...' : 'Test Page Creation'}
        </Button>

        {result && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Result:</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}