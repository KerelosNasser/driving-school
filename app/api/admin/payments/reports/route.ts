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
  status: z.string().optional(),
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
    .select('session_id, user_id, amount, currency, gateway, status, created_at, completed_at, metadata')
    .eq('currency', 'AUD')

  if (error) return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 })

  const { data: usersData } = await supabase
    .from('users')
    .select('id, full_name, email, address')

  const usersById = new Map<string, any>((usersData || []).map((u: any) => [u.id, u]))

  let rows = (sessions || []).map((s: any) => {
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
      userName: u?.full_name || '',
      userEmail: u?.email || '',
      userAddress: u?.address || '',
    }
  })

  if (parsed.data.status) rows = rows.filter(r => r.status === parsed.data.status)
  if (cityFilter) rows = rows.filter(r => (r.userAddress || '').toLowerCase().includes(cityFilter.toLowerCase()))
  if (dateFrom) rows = rows.filter(r => new Date(r.createdAt) >= dateFrom)
  if (dateTo) rows = rows.filter(r => new Date(r.createdAt) <= dateTo)

  const header = ['sessionId','paymentId','status','amount','currency','gateway','createdAt','completedAt','userName','userEmail','userAddress']
  const lines = [header.join(',')]
  for (const r of rows) {
    lines.push([
      r.sessionId,
      r.paymentId,
      r.status,
      String(r.amount),
      r.currency,
      r.gateway,
      r.createdAt,
      r.completedAt || '',
      r.userName.replace(/,/g,' '),
      r.userEmail,
      r.userAddress.replace(/,/g,' '),
    ].join(','))
  }

  const csv = lines.join('\n')
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="au-transactions.csv"',
    },
  })
}