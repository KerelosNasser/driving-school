import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const querySchema = z.object({
  city: z.string().optional(),
  onlyBrisbane: z.union([z.string(), z.boolean()]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams.entries())
  const parsed = querySchema.safeParse(params)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid query' }, { status: 400 })

  const onlyBrisbane = String(parsed.data.onlyBrisbane || '').toLowerCase() === 'true'
  const cityFilter = parsed.data.city || (onlyBrisbane ? 'Brisbane' : undefined)
  const dateFrom = parsed.data.dateFrom ? new Date(parsed.data.dateFrom) : undefined
  const dateTo = parsed.data.dateTo ? new Date(parsed.data.dateTo) : undefined

  const { data: sessions, error } = await supabase
    .from('manual_payment_sessions')
    .select('id, user_id, amount, currency, gateway, status, created_at, completed_at, metadata')
    .eq('currency', 'AUD')

  if (error) return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 })

  const { data: usersData } = await supabase
    .from('users')
    .select('id, address, latitude, longitude')

  const usersById = new Map<string, any>((usersData || []).map((u: any) => [u.id, u]))

  const filtered = (sessions || []).filter((s: any) => {
    if (dateFrom && new Date(s.created_at) < dateFrom) return false
    if (dateTo && new Date(s.created_at) > dateTo) return false
    if (!cityFilter) return true
    const u = usersById.get(s.user_id)
    const address = (u?.address || '').toLowerCase()
    return address.includes(cityFilter.toLowerCase())
  })

  const successCount = filtered.filter((s: any) => s.status === 'completed').length
  const failureCount = filtered.filter((s: any) => s.status !== 'completed').length

  const trendsMap = new Map<string, { date: string; count: number; revenue: number }>()
  for (const s of filtered) {
    const key = new Date(s.created_at).toISOString().slice(0, 10)
    const prev = trendsMap.get(key) || { date: key, count: 0, revenue: 0 }
    prev.count += 1
    if (s.status === 'completed') prev.revenue += Number(s.amount || 0)
    trendsMap.set(key, prev)
  }
  const volumeTrends = Array.from(trendsMap.values()).sort((a, b) => a.date.localeCompare(b.date))

  const geoMap = new Map<string, number>()
  for (const s of filtered) {
    const u = usersById.get(s.user_id)
    const city = (u?.address || '').includes('Brisbane') ? 'Brisbane' : 'Other'
    geoMap.set(city, (geoMap.get(city) || 0) + 1)
  }
  const geographicDistribution = Array.from(geoMap.entries()).map(([city, count]) => ({ city, count }))

  const totalRevenue = filtered.filter((s: any) => s.status === 'completed').reduce((acc: number, s: any) => acc + Number(s.amount || 0), 0)

  const revenueByGateway = filtered.reduce((acc: Record<string, number>, s: any) => {
    const g = s.gateway || 'manual'
    if (s.status === 'completed') acc[g] = (acc[g] || 0) + Number(s.amount || 0)
    return acc
  }, {})

  return NextResponse.json({
    successFailure: { success: successCount, failure: failureCount },
    geographicDistribution,
    volumeTrends,
    revenue: { total: totalRevenue, byGateway: revenueByGateway },
  })
}