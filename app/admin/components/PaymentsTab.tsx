'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

type Metrics = {
  successFailure: { success: number; failure: number }
  geographicDistribution: { city: string; count: number }[]
  volumeTrends: { date: string; count: number; revenue: number }[]
  revenue: { total: number; byGateway: Record<string, number> }
}

type Txn = {
  sessionId: string
  paymentId: string
  status: string
  amount: number
  currency: string
  gateway: string
  createdAt: string
  completedAt?: string
  user: { id: string; name: string; email: string; address: string }
}

export function PaymentsTab() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [transactions, setTransactions] = useState<Txn[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentId, setPaymentId] = useState('')
  const [onlyBrisbane, setOnlyBrisbane] = useState(true)
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const loadData = async () => {
    setLoading(true)
    const q = new URLSearchParams()
    if (onlyBrisbane) q.set('onlyBrisbane', 'true')
    if (status) q.set('status', status)
    if (dateFrom) q.set('dateFrom', dateFrom)
    if (dateTo) q.set('dateTo', dateTo)
    const [mRes, tRes] = await Promise.all([
      fetch(`/api/admin/payments/metrics?${q.toString()}`),
      fetch(`/api/admin/payments/transactions?${q.toString()}`),
    ])
    const mJson = mRes.ok ? await mRes.json() : null
    const tJson = tRes.ok ? await tRes.json() : { transactions: [] }
    setMetrics(mJson)
    setTransactions(tJson.transactions || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('admin-payments-analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_payment_sessions' }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onlyBrisbane, status, dateFrom, dateTo])

  const revenueByGatewayData = useMemo(() => {
    if (!metrics) return []
    return Object.entries(metrics.revenue.byGateway).map(([gateway, amount]) => ({ gateway, amount }))
  }, [metrics])

  const filteredTransactions = useMemo(() => {
    let rows = transactions
    if (paymentId) rows = rows.filter(r => r.paymentId === paymentId)
    return rows
  }, [transactions, paymentId])

  const exportCsv = () => {
    const q = new URLSearchParams()
    if (onlyBrisbane) q.set('onlyBrisbane', 'true')
    if (status) q.set('status', status)
    if (dateFrom) q.set('dateFrom', dateFrom)
    if (dateTo) q.set('dateTo', dateTo)
    window.location.href = `/api/admin/payments/reports?${q.toString()}`
  }

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="paymentId" className="text-xs md:text-sm">Payment ID</Label>
              <Input 
                id="paymentId" 
                value={paymentId} 
                onChange={e => setPaymentId(e.target.value)} 
                placeholder="PAY_..." 
                className="h-9 md:h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs md:text-sm">Status</Label>
              <Input 
                id="status" 
                value={status} 
                onChange={e => setStatus(e.target.value)} 
                placeholder="completed/pending" 
                className="h-9 md:h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateFrom" className="text-xs md:text-sm">From</Label>
              <Input 
                id="dateFrom" 
                type="date" 
                value={dateFrom} 
                onChange={e => setDateFrom(e.target.value)} 
                className="h-9 md:h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateTo" className="text-xs md:text-sm">To</Label>
              <Input 
                id="dateTo" 
                type="date" 
                value={dateTo} 
                onChange={e => setDateTo(e.target.value)} 
                className="h-9 md:h-10"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-2">
            <Button 
              onClick={loadData} 
              disabled={loading} 
              className="w-full sm:w-auto h-9 md:h-10 text-sm"
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setOnlyBrisbane(v => !v)}
              className="w-full sm:w-auto h-9 md:h-10 text-sm"
            >
              {onlyBrisbane ? 'Brisbane: ON' : 'Brisbane: OFF'}
            </Button>
            <Button 
              variant="outline" 
              onClick={exportCsv}
              className="w-full sm:w-auto h-9 md:h-10 text-sm"
            >
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Success vs Failure</CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <div className="h-[200px] md:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'Payments', success: metrics?.successFailure.success || 0, failure: metrics?.successFailure.failure || 0 }]}> 
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="success" fill="#10b981" />
                  <Bar dataKey="failure" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Geographic Distribution (AU)</CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <div className="h-[200px] md:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(metrics?.geographicDistribution || []).map(d => ({ city: d.city, count: d.count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Transaction Volume Trends</CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <div className="h-[200px] md:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics?.volumeTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Revenue Analytics</CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <div className="h-[200px] md:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByGatewayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="gateway" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-2 md:p-3 font-medium whitespace-nowrap">Payment ID</th>
                  <th className="p-2 md:p-3 font-medium whitespace-nowrap">Status</th>
                  <th className="p-2 md:p-3 font-medium whitespace-nowrap">Amount</th>
                  <th className="p-2 md:p-3 font-medium whitespace-nowrap">Gateway</th>
                  <th className="p-2 md:p-3 font-medium whitespace-nowrap">Created</th>
                  <th className="p-2 md:p-3 font-medium whitespace-nowrap">User</th>
                  <th className="p-2 md:p-3 font-medium whitespace-nowrap">Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(r => (
                  <tr key={r.sessionId} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-2 md:p-3 font-mono text-xs whitespace-nowrap">{r.paymentId}</td>
                    <td className="p-2 md:p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-2 md:p-3 font-medium whitespace-nowrap">
                      ${r.amount.toFixed(2)} {r.currency}
                    </td>
                    <td className="p-2 md:p-3 capitalize whitespace-nowrap">{r.gateway}</td>
                    <td className="p-2 md:p-3 whitespace-nowrap text-xs md:text-sm">
                      {new Date(r.createdAt).toLocaleString('en-AU', { 
                        dateStyle: 'short', 
                        timeStyle: 'short' 
                      })}
                    </td>
                    <td className="p-2 md:p-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{r.user.name}</span>
                        <span className="text-xs text-muted-foreground">{r.user.email}</span>
                      </div>
                    </td>
                    <td className="p-2 md:p-3 max-w-[200px] truncate" title={r.user.address}>
                      {r.user.address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTransactions.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No transactions found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}