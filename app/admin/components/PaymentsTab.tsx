'use client'

import { useEffect, useMemo, useState } from 'react'
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="paymentId">Payment ID</Label>
            <Input id="paymentId" value={paymentId} onChange={e => setPaymentId(e.target.value)} placeholder="PAY_..." />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Input id="status" value={status} onChange={e => setStatus(e.target.value)} placeholder="completed/pending" />
          </div>
          <div>
            <Label htmlFor="dateFrom">From</Label>
            <Input id="dateFrom" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="dateTo">To</Label>
            <Input id="dateTo" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={loadData} disabled={loading}>Apply</Button>
            <Button variant="secondary" onClick={() => setOnlyBrisbane(v => !v)}>{onlyBrisbane ? 'Brisbane: ON' : 'Brisbane: OFF'}</Button>
            <Button variant="outline" onClick={exportCsv}>Export AU CSV</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Success vs Failure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'Payments', success: metrics?.successFailure.success || 0, failure: metrics?.successFailure.failure || 0 }]}> 
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="success" fill="#10b981" />
                  <Bar dataKey="failure" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution (AU)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(metrics?.geographicDistribution || []).map(d => ({ city: d.city, count: d.count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics?.volumeTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#f59e0b" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByGatewayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="gateway" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Payment ID</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Gateway</th>
                  <th className="p-2">Created</th>
                  <th className="p-2">User</th>
                  <th className="p-2">Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(r => (
                  <tr key={r.sessionId} className="border-t">
                    <td className="p-2 font-mono">{r.paymentId}</td>
                    <td className="p-2">{r.status}</td>
                    <td className="p-2">${r.amount.toFixed(2)} {r.currency}</td>
                    <td className="p-2">{r.gateway}</td>
                    <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="p-2">{r.user.name} ({r.user.email})</td>
                    <td className="p-2">{r.user.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTransactions.length === 0 && (
              <div className="p-4 text-gray-500">No transactions found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}