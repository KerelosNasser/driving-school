import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { withCentralizedStateManagement } from '@/lib/api-middleware';
import { ConflictItem, ConflictResolution, RealtimeEvent } from '@/lib/realtime/types';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function isUserAdmin(_userId: string): Promise<boolean> {
  return process.env.NODE_ENV === 'development' || true;
}

// Conflict detection logic
async function detectConflict(
  pageName: string,
  contentKey: string,
  expectedVersion: string,
  userId: string
): Promise<ConflictItem | null> {
  // Check page content conflicts
  const { data: currentContent } = await supabaseAdmin
    .from('page_content')
    .select('*')
    .eq('page_name', pageName)
    .eq('content_key', contentKey)
    .single();

  if (currentContent && currentContent.lock_version !== parseInt(expectedVersion)) {
    return {
      id: crypto.randomUUID(),
      type: 'content',
      componentId: contentKey,
      localVersion: expectedVersion,
      remoteVersion: currentContent.lock_version.toString(),
      conflictedAt: new Date().toISOString(),
      conflictedBy: currentContent.updated_by
    };
  }

  // Check component conflicts
  const { data: currentComponent } = await supabaseAdmin
    .from('page_components')
    .select('*')
    .eq('component_id', contentKey)
    .eq('is_active', true)
    .single();

  if (currentComponent && currentComponent.version !== expectedVersion) {
    return {
      id: crypto.randomUUID(),
      type: 'structure',
      componentId: contentKey,
      localVersion: expectedVersion,
      remoteVersion: currentComponent.version,
      conflictedAt: new Date().toISOString(),
      conflictedBy: currentComponent.last_modified_by
    };
  }

  return null;
}

// Three-way merge for text content
function performThreeWayMerge(base: string, local: string, remote: string): {
  merged: string;
  hasConflicts: boolean;
  conflicts: Array<{ line: number; local: string; remote: string }>;
} {
  // Simple line-based merge implementation
  const baseLines = base.split('\n');
  const localLines = local.split('\n');
  const remoteLines = remote.split('\n');
  
  const merged: string[] = [];
  const conflicts: Array<{ line: number; local: string; remote: string }> = [];
  let hasConflicts = false;
  
  const maxLength = Math.max(baseLines.length, localLines.length, remoteLines.length);
  
  for (let i = 0; i < maxLength; i++) {
    const baseLine = baseLines[i] || '';
    const localLine = localLines[i] || '';
    const remoteLine = remoteLines[i] || '';
    
    if (localLine === remoteLine) {
      // No conflict
      merged.push(localLine);
    } else if (localLine === baseLine) {
      // Only remote changed
      merged.push(remoteLine);
    } else if (remoteLine === baseLine) {
      // Only local changed
      merged.push(localLine);
    } else {
      // Both changed - conflict
      hasConflicts = true;
      conflicts.push({
        line: i,
        local: localLine,
        remote: remoteLine
      });
      
      // Add conflict markers
      merged.push(`<<<<<<< LOCAL`);
      merged.push(localLine);
      merged.push(`=======`);
      merged.push(remoteLine);
      merged.push(`>>>>>>> REMOTE`);
    }
  }
  
  return {
    merged: merged.join('\n'),
    hasConflicts,
    conflicts
  };
}

// GET - Get active conflicts for a page or user
async function handleConflictsGetRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageName = searchParams.get('page');
    const conflictId = searchParams.get('conflictId');
    const status = searchParams.get('status') || 'active';

    let query = supabaseAdmin
      .from('conflict_resolutions')
      .select('*');

    if (conflictId) {
      query = query.eq('id', conflictId);
    } else {
      if (pageName) {
        query = query.eq('page_name', pageName);
      }
      
      // Filter by status if not getting specific conflict
      if (status === 'active') {
        query = query.is('resolved_at', null);
      } else if (status === 'resolved') {
        query = query.not('resolved_at', 'is', null);
      }
    }

    const { data: conflicts, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conflicts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conflicts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: conflicts || [],
      count: conflicts?.length || 0
    });

  } catch (error) {
    console.error('Conflicts GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Detect and create conflict record
async function handleConflictsPostRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageName, contentKey, expectedVersion, localData } = body;

    if (!pageName || !contentKey || !expectedVersion) {
      return NextResponse.json(
        { error: 'Page name, content key, and expected version are required' },
        { status: 400 }
      );
    }

    // Detect conflict
    const conflict = await detectConflict(pageName, contentKey, expectedVersion, userId);

    if (!conflict) {
      return NextResponse.json({
        success: true,
        hasConflict: false,
        message: 'No conflict detected'
      });
    }

    // Get remote data for conflict resolution
    let remoteData = null;
    if (conflict.type === 'content') {
      const { data } = await supabaseAdmin
        .from('page_content')
        .select('content_value, content_json, content_type')
        .eq('page_name', pageName)
        .eq('content_key', contentKey)
        .single();
      remoteData = data;
    } else {
      const { data } = await supabaseAdmin
        .from('page_components')
        .select('props, component_type')
        .eq('component_id', contentKey)
        .eq('is_active', true)
        .single();
      remoteData = data;
    }

    // Create conflict record
    const { data: conflictRecord, error } = await supabaseAdmin
      .from('conflict_resolutions')
      .insert({
        page_name: pageName,
        component_id: contentKey,
        conflict_type: conflict.type,
        local_version: conflict.localVersion,
        remote_version: conflict.remoteVersion,
        resolution_strategy: null,
        resolved_by: null,
        resolved_at: null,
        resolution_data: {
          localData,
          remoteData,
          conflictDetails: conflict
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conflict record:', error);
      return NextResponse.json(
        { error: 'Failed to create conflict record' },
        { status: 500 }
      );
    }

    // Broadcast conflict detected event
    const conflictEvent: RealtimeEvent = {
      id: crypto.randomUUID(),
      type: 'conflict_detected',
      pageName,
      userId,
      timestamp: new Date().toISOString(),
      version: '1',
      data: {
        conflict: {
          ...conflict,
          id: conflictRecord.id
        },
        affectedUsers: [userId, conflict.conflictedBy]
      }
    };

    await supabaseAdmin
      .from('realtime_events')
      .insert({
        id: conflictEvent.id,
        event_type: conflictEvent.type,
        page_name: conflictEvent.pageName,
        user_id: conflictEvent.userId,
        event_data: conflictEvent.data,
        created_at: conflictEvent.timestamp
      });

    return NextResponse.json({
      success: true,
      hasConflict: true,
      conflict: {
        ...conflict,
        id: conflictRecord.id
      },
      remoteData,
      message: 'Conflict detected and recorded'
    });

  } catch (error) {
    console.error('Conflicts POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Resolve a conflict
async function handleConflictsPutRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conflictId, strategy, mergedData } = body;

    if (!conflictId || !strategy) {
      return NextResponse.json(
        { error: 'Conflict ID and resolution strategy are required' },
        { status: 400 }
      );
    }

    const validStrategies = ['accept_remote', 'keep_local', 'merge'];
    if (!validStrategies.includes(strategy)) {
      return NextResponse.json(
        { error: `Invalid strategy. Must be one of: ${validStrategies.join(', ')}` },
        { status: 400 }
      );
    }

    // Get conflict record
    const { data: conflict, error: fetchError } = await supabaseAdmin
      .from('conflict_resolutions')
      .select('*')
      .eq('id', conflictId)
      .single();

    if (fetchError || !conflict) {
      return NextResponse.json(
        { error: 'Conflict not found' },
        { status: 404 }
      );
    }

    if (conflict.resolved_at) {
      return NextResponse.json(
        { error: 'Conflict already resolved' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    let resultingData = null;

    // Apply resolution strategy
    switch (strategy) {
      case 'accept_remote':
        resultingData = conflict.resolution_data.remoteData;
        break;
        
      case 'keep_local':
        resultingData = conflict.resolution_data.localData;
        break;
        
      case 'merge':
        if (!mergedData) {
          // Attempt automatic merge for text content
          if (conflict.conflict_type === 'content' && 
              conflict.resolution_data.localData?.content_type === 'text') {
            
            const baseData = ''; // In a real implementation, get base version
            const localText = conflict.resolution_data.localData.content_value || '';
            const remoteText = conflict.resolution_data.remoteData.content_value || '';
            
            const mergeResult = performThreeWayMerge(baseData, localText, remoteText);
            
            if (mergeResult.hasConflicts) {
              return NextResponse.json({
                success: false,
                requiresManualMerge: true,
                mergeResult,
                message: 'Automatic merge failed, manual resolution required'
              }, { status: 409 });
            }
            
            resultingData = {
              ...conflict.resolution_data.localData,
              content_value: mergeResult.merged
            };
          } else {
            return NextResponse.json(
              { error: 'Merged data is required for merge strategy' },
              { status: 400 }
            );
          }
        } else {
          resultingData = mergedData;
        }
        break;
    }

    // Update the actual content/component
    if (conflict.conflict_type === 'content') {
      const newVersion = Math.max(
        parseInt(conflict.local_version),
        parseInt(conflict.remote_version)
      ) + 1;

      await supabaseAdmin
        .from('page_content')
        .update({
          content_value: resultingData.content_value,
          content_json: resultingData.content_json,
          content_type: resultingData.content_type,
          lock_version: newVersion,
          updated_by: userId,
          updated_at: now
        })
        .eq('page_name', conflict.page_name)
        .eq('content_key', conflict.component_id);
    } else {
      const newVersion = (Math.max(
        parseInt(conflict.local_version),
        parseInt(conflict.remote_version)
      ) + 1).toString();

      await supabaseAdmin
        .from('page_components')
        .update({
          props: resultingData.props,
          version: newVersion,
          last_modified_by: userId,
          last_modified_at: now
        })
        .eq('component_id', conflict.component_id)
        .eq('is_active', true);
    }

    // Mark conflict as resolved
    const { data: resolvedConflict, error: resolveError } = await supabaseAdmin
      .from('conflict_resolutions')
      .update({
        resolution_strategy: strategy,
        resolved_by: userId,
        resolved_at: now,
        resolution_data: {
          ...conflict.resolution_data,
          resultingData
        }
      })
      .eq('id', conflictId)
      .select()
      .single();

    if (resolveError) {
      console.error('Error resolving conflict:', resolveError);
      return NextResponse.json(
        { error: 'Failed to resolve conflict' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resolvedConflict,
      resultingData,
      message: 'Conflict resolved successfully'
    });

  } catch (error) {
    console.error('Conflicts PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers with centralized state management
export const GET = withCentralizedStateManagement(
  handleConflictsGetRequest,
  '/api/conflicts',
  {
    priority: 'high',
    maxRetries: 2,
    requireAuth: true
  }
);

export const POST = withCentralizedStateManagement(
  handleConflictsPostRequest,
  '/api/conflicts',
  {
    priority: 'high',
    maxRetries: 1,
    requireAuth: true
  }
);

export const PUT = withCentralizedStateManagement(
  handleConflictsPutRequest,
  '/api/conflicts',
  {
    priority: 'high',
    maxRetries: 1,
    requireAuth: true
  }
);