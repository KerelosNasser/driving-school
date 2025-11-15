import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const querySchema = z.object({
  paymentId: z.string().optional(),
  status: z.string().optional(),
  gateway: z.string().optional(),
  city: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  onlyBrisbane: z.union([z.string(), z.boolean()]).optional(),
})

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams.entries())
  const parsed = querySchema.safeParse(params)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid query' }, { status: 400 })

  const page = Math.max(parseInt(parsed.data.page || '1'), 1)
  const limit = Math.min(Math.max(parseInt(parsed.data.limit || '20'), 1), 100)
  const onlyBrisbane = String(parsed.data.onlyBrisbane || '').toLowerCase() === 'true'
  const cityFilter = parsed.data.city || (onlyBrisbane ? 'Brisbane' : undefined)
  const dateFrom = parsed.data.dateFrom ? new Date(parsed.data.dateFrom) : undefined
  const dateTo = parsed.data.dateTo ? new Date(parsed.data.dateTo) : undefined

  const { data: sessions, error } = await supabase
    .from('manual_payment_sessions')
    .select('session_id, user_id, amount, currency, gateway, status, created_at, completed_at, metadata')
    .eq('currency', 'AUD')

  if (error) return NextResponse.json({ error: 'Failed to load transactions' }, { status: 500 })

  const { data: usersData } = await supabase
    .from('users')
    .select('id, full_name, email, address')

  const usersById = new Map<string, any>((usersData || []).map((u: any) => [u.id, u]))

  let rows = (sessions || [])
    .map((s: any) => {
      const u = usersById.get(s.user_id)
      return {
        sessionId: s.session_id,
        paymentId: s.metadata?.payment_id || '',
        status: s.status,
        amount: Number(s.amount || 0),
        currency: s.currency,
        gateway: s.gateway,
        createdAt: s.created_at,
        completedAt: s.completed_at,
        user: { id: s.user_id, name: u?.full_name || '', email: u?.email || '', address: u?.address || '' },
      }
    })

  if (parsed.data.paymentId) rows = rows.filter(r => r.paymentId === parsed.data.paymentId)
  if (parsed.data.status) rows = rows.filter(r => r.status === parsed.data.status)
  if (parsed.data.gateway) rows = rows.filter(r => r.gateway === parsed.data.gateway)
  if (cityFilter) rows = rows.filter(r => (r.user.address || '').toLowerCase().includes(cityFilter.toLowerCase()))
  if (dateFrom) rows = rows.filter(r => new Date(r.createdAt) >= dateFrom)
  if (dateTo) rows = rows.filter(r => new Date(r.createdAt) <= dateTo)

  const total = rows.length
  const start = (page - 1) * limit
  const paged = rows.slice(start, start + limit)

  return NextResponse.json({
    transactions: paged,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}