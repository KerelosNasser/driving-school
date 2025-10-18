'use client';

import { DragDropTest } from '@/components/drag-drop/DragDropTest';
import { DragDropExample } from '@/components/drag-drop/DragDropExample';

export default function TestDNDPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Drag & Drop System Test</h1>
      
      <div className="space-y-12">
        {/* Simple Test */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Simple Test</h2>
          <DragDropTest />
        </section>
        
        {/* Advanced Example */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Advanced Example</h2>
          <DragDropExample />
        </section>
      </div>
    </div>
  );
}