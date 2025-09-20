'use client';

import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Code, 
  Eye,
  Plus,
  Minus,
  Equal
} from 'lucide-react';

interface ConflictDiffViewProps {
  localVersion: any;
  remoteVersion: any;
  contentType: 'content' | 'structure';
  baseVersion?: any;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'modified';
  content: string;
  lineNumber?: number;
}

export function ConflictDiffView({
  localVersion,
  remoteVersion,
  contentType,
  baseVersion
}: ConflictDiffViewProps) {
  // Generate diff for text content
  const textDiff = useMemo(() => {
    if (typeof localVersion === 'string' && typeof remoteVersion === 'string') {
      return generateTextDiff(localVersion, remoteVersion);
    }
    return null;
  }, [localVersion, remoteVersion]);

  // Generate diff for object/JSON content
  const objectDiff = useMemo(() => {
    if (typeof localVersion === 'object' && typeof remoteVersion === 'object') {
      return generateObjectDiff(localVersion, remoteVersion);
    }
    return null;
  }, [localVersion, remoteVersion]);

  const renderTextDiff = (diff: DiffLine[]) => (
    <div className="font-mono text-sm">
      {diff.map((line, index) => (
        <div
          key={index}
          className={`flex items-start gap-2 px-3 py-1 ${
            line.type === 'added' 
              ? 'bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500' 
              : line.type === 'removed'
              ? 'bg-red-50 dark:bg-red-900/20 border-l-2 border-red-500'
              : line.type === 'modified'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-2 border-yellow-500'
              : 'bg-gray-50 dark:bg-gray-900/20'
          }`}
        >
          <div className="flex items-center gap-1 min-w-[60px] text-xs text-muted-foreground">
            {line.type === 'added' && <Plus className="h-3 w-3 text-green-500" />}
            {line.type === 'removed' && <Minus className="h-3 w-3 text-red-500" />}
            {line.type === 'unchanged' && <Equal className="h-3 w-3 text-gray-400" />}
            {line.type === 'modified' && <FileText className="h-3 w-3 text-yellow-500" />}
            <span>{line.lineNumber || index + 1}</span>
          </div>
          <div className="flex-1 whitespace-pre-wrap break-words">
            {line.content}
          </div>
        </div>
      ))}
    </div>
  );

  const renderObjectDiff = (diff: any) => (
    <div className="space-y-2">
      {Object.entries(diff).map(([key, value]: [string, any]) => (
        <div key={key} className="border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Code className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium font-mono text-sm">{key}</span>
            <Badge variant={
              value.status === 'added' ? 'default' :
              value.status === 'removed' ? 'destructive' :
              value.status === 'modified' ? 'secondary' : 'outline'
            }>
              {value.status}
            </Badge>
          </div>
          
          {value.status === 'modified' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Local Version</div>
                <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-sm font-mono">
                  {JSON.stringify(value.local, null, 2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Remote Version</div>
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-sm font-mono">
                  {JSON.stringify(value.remote, null, 2)}
                </div>
              </div>
            </div>
          )}
          
          {value.status === 'added' && (
            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-sm font-mono">
              {JSON.stringify(value.value, null, 2)}
            </div>
          )}
          
          {value.status === 'removed' && (
            <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-sm font-mono">
              {JSON.stringify(value.value, null, 2)}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderSideBySide = () => (
    <div className="grid grid-cols-2 gap-4 h-full">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            Your Changes (Local)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words">
              {typeof localVersion === 'string' 
                ? localVersion 
                : JSON.stringify(localVersion, null, 2)
              }
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-green-500" />
            Remote Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words">
              {typeof remoteVersion === 'string' 
                ? remoteVersion 
                : JSON.stringify(remoteVersion, null, 2)
              }
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="unified" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unified" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Unified Diff
          </TabsTrigger>
          <TabsTrigger value="side-by-side" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Side by Side
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="unified" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Changes Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                {textDiff && renderTextDiff(textDiff)}
                {objectDiff && renderObjectDiff(objectDiff)}
                {!textDiff && !objectDiff && (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Unable to generate diff for this content type</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="side-by-side" className="mt-4">
          {renderSideBySide()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to generate text diff
function generateTextDiff(local: string, remote: string): DiffLine[] {
  const localLines = local.split('\n');
  const remoteLines = remote.split('\n');
  const diff: DiffLine[] = [];

  // Simple line-by-line comparison
  const maxLines = Math.max(localLines.length, remoteLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const localLine = localLines[i];
    const remoteLine = remoteLines[i];
    
    if (localLine === undefined) {
      // Line only exists in remote
      diff.push({
        type: 'added',
        content: remoteLine,
        lineNumber: i + 1
      });
    } else if (remoteLine === undefined) {
      // Line only exists in local
      diff.push({
        type: 'removed',
        content: localLine,
        lineNumber: i + 1
      });
    } else if (localLine === remoteLine) {
      // Lines are identical
      diff.push({
        type: 'unchanged',
        content: localLine,
        lineNumber: i + 1
      });
    } else {
      // Lines are different
      diff.push({
        type: 'removed',
        content: localLine,
        lineNumber: i + 1
      });
      diff.push({
        type: 'added',
        content: remoteLine,
        lineNumber: i + 1
      });
    }
  }

  return diff;
}

// Helper function to generate object diff
function generateObjectDiff(local: any, remote: any): Record<string, any> {
  const diff: Record<string, any> = {};
  const allKeys = new Set([
    ...Object.keys(local || {}),
    ...Object.keys(remote || {})
  ]);

  for (const key of allKeys) {
    const localValue = local?.[key];
    const remoteValue = remote?.[key];

    if (localValue === undefined && remoteValue !== undefined) {
      diff[key] = {
        status: 'added',
        value: remoteValue
      };
    } else if (localValue !== undefined && remoteValue === undefined) {
      diff[key] = {
        status: 'removed',
        value: localValue
      };
    } else if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
      diff[key] = {
        status: 'modified',
        local: localValue,
        remote: remoteValue
      };
    } else {
      diff[key] = {
        status: 'unchanged',
        value: localValue
      };
    }
  }

  return diff;
}