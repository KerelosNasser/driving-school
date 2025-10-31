import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { withCentralizedStateManagement } from '@/lib/api-middleware';

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

async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();
    
    return !error && user?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// GET - Get conflict resolution history and audit trail
async function handleConflictHistoryGetRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageName = searchParams.get('page');
    const componentId = searchParams.get('componentId');
    const resolvedBy = searchParams.get('resolvedBy');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('conflict_resolutions')
      .select(`
        *,
        content_versions!inner(
          version_number,
          created_at as version_created_at,
          created_by as version_created_by
        )
      `)
      .not('resolved_at', 'is', null); // Only resolved conflicts

    if (pageName) {
      query = query.eq('page_name', pageName);
    }

    if (componentId) {
      query = query.eq('component_id', componentId);
    }

    if (resolvedBy) {
      query = query.eq('resolved_by', resolvedBy);
    }

    if (startDate) {
      query = query.gte('resolved_at', startDate);
    }

    if (endDate) {
      query = query.lte('resolved_at', endDate);
    }

    const { data: conflicts, error } = await query
      .order('resolved_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching conflict history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conflict history' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from('conflict_resolutions')
      .select('*', { count: 'exact', head: true })
      .not('resolved_at', 'is', null);

    if (countError) {
      console.error('Error getting conflict count:', countError);
    }

    // Transform data for better readability
    const transformedConflicts = (conflicts || []).map(conflict => ({
      id: conflict.id,
      pageName: conflict.page_name,
      componentId: conflict.component_id,
      conflictType: conflict.conflict_type,
      localVersion: conflict.local_version,
      remoteVersion: conflict.remote_version,
      resolutionStrategy: conflict.resolution_strategy,
      resolvedBy: conflict.resolved_by,
      resolvedAt: conflict.resolved_at,
      resolutionData: conflict.resolution_data,
      relatedVersions: conflict.content_versions || []
    }));

    return NextResponse.json({
      success: true,
      data: transformedConflicts,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Conflict history GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get conflict statistics and analytics
async function handleConflictStatsGetRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const pageName = searchParams.get('page');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let baseQuery = supabaseAdmin
      .from('conflict_resolutions')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (pageName) {
      baseQuery = baseQuery.eq('page_name', pageName);
    }

    // Get total conflicts
    const { data: allConflicts, error: allError } = await baseQuery;

    if (allError) {
      console.error('Error fetching conflict stats:', allError);
      return NextResponse.json(
        { error: 'Failed to fetch conflict statistics' },
        { status: 500 }
      );
    }

    const conflicts = allConflicts || [];

    // Calculate statistics
    const totalConflicts = conflicts.length;
    const resolvedConflicts = conflicts.filter(c => c.resolved_at).length;
    const activeConflicts = totalConflicts - resolvedConflicts;
    const resolutionRate = totalConflicts > 0 ? (resolvedConflicts / totalConflicts) * 100 : 0;

    // Resolution strategy breakdown
    const strategyBreakdown = conflicts
      .filter(c => c.resolution_strategy)
      .reduce((acc: Record<string, number>, conflict) => {
        acc[conflict.resolution_strategy] = (acc[conflict.resolution_strategy] || 0) + 1;
        return acc;
      }, {});

    // Conflict type breakdown
    const typeBreakdown = conflicts.reduce((acc: Record<string, number>, conflict) => {
      acc[conflict.conflict_type] = (acc[conflict.conflict_type] || 0) + 1;
      return acc;
    }, {});

    // Page breakdown
    const pageBreakdown = conflicts.reduce((acc: Record<string, number>, conflict) => {
      acc[conflict.page_name] = (acc[conflict.page_name] || 0) + 1;
      return acc;
    }, {});

    // Average resolution time
    const resolvedWithTime = conflicts.filter(c => c.resolved_at && c.created_at);
    const avgResolutionTime = resolvedWithTime.length > 0 
      ? resolvedWithTime.reduce((sum, conflict) => {
          const created = new Date(conflict.created_at).getTime();
          const resolved = new Date(conflict.resolved_at).getTime();
          return sum + (resolved - created);
        }, 0) / resolvedWithTime.length
      : 0;

    // Daily conflict trend
    const dailyTrend: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyTrend[dateKey] = 0;
    }

    conflicts.forEach(conflict => {
      const dateKey = conflict.created_at.split('T')[0];
      if (dailyTrend.hasOwnProperty(dateKey)) {
        dailyTrend[dateKey]++;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalConflicts,
          resolvedConflicts,
          activeConflicts,
          resolutionRate: Math.round(resolutionRate * 100) / 100,
          avgResolutionTimeMs: Math.round(avgResolutionTime),
          avgResolutionTimeHours: Math.round((avgResolutionTime / (1000 * 60 * 60)) * 100) / 100
        },
        breakdowns: {
          strategy: strategyBreakdown,
          type: typeBreakdown,
          page: pageBreakdown
        },
        trends: {
          daily: Object.entries(dailyTrend)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, count]) => ({ date, count }))
        },
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Conflict stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Export conflict history (for audit purposes)
async function handleConflictHistoryPostRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { format = 'json', filters = {} } = body;

    let query = supabaseAdmin
      .from('conflict_resolutions')
      .select('*');

    // Apply filters
    if (filters.pageName) {
      query = query.eq('page_name', filters.pageName);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters.resolvedBy) {
      query = query.eq('resolved_by', filters.resolvedBy);
    }

    const { data: conflicts, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error exporting conflict history:', error);
      return NextResponse.json(
        { error: 'Failed to export conflict history' },
        { status: 500 }
      );
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = [
        'ID', 'Page Name', 'Component ID', 'Conflict Type', 
        'Local Version', 'Remote Version', 'Resolution Strategy',
        'Resolved By', 'Created At', 'Resolved At'
      ];

      const csvRows = (conflicts || []).map(conflict => [
        conflict.id,
        conflict.page_name,
        conflict.component_id,
        conflict.conflict_type,
        conflict.local_version,
        conflict.remote_version,
        conflict.resolution_strategy || 'N/A',
        conflict.resolved_by || 'N/A',
        conflict.created_at,
        conflict.resolved_at || 'N/A'
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="conflict-history-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Default JSON format
    return NextResponse.json({
      success: true,
      data: conflicts || [],
      exportedAt: new Date().toISOString(),
      filters,
      count: conflicts?.length || 0
    });

  } catch (error) {
    console.error('Conflict history export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers with centralized state management
export const GET = withCentralizedStateManagement(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'stats') {
      return handleConflictStatsGetRequest(request);
    }
    
    return handleConflictHistoryGetRequest(request);
  },
  '/api/conflicts/history',
  {
    priority: 'medium',
    maxRetries: 2,
    requireAuth: true
  }
);

export const POST = withCentralizedStateManagement(
  handleConflictHistoryPostRequest,
  '/api/conflicts/history',
  {
    priority: 'low',
    maxRetries: 1,
    requireAuth: true
  }
);