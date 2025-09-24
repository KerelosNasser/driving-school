'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Plus, Minus, CreditCard, Calendar, ChevronLeft, ChevronRight, Filter, Loader2, AlertCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';


interface QuotaTransaction {
  id: string;
  user_id: string;
  hours_change: number;
  transaction_type: 'purchase' | 'booking' | 'refund' | 'adjustment';
  description: string;
  package_id?: string;
  booking_id?: string;
  payment_id?: string;
  created_at: string;
  packages?: {
    name: string;
    hours: number;
  };
  bookings?: {
    date: string;
    time: string;
    status: string;
  };
}

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_count: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

export default function TransactionHistoryTab() {
  const [transactions, setTransactions] = useState<QuotaTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');

  // Fetch transactions
  useEffect(() => {
    fetchTransactions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterType]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (filterType !== 'all') {
        params.append('type', filterType);
      }
      
      const response = await fetch(`/api/quota/transactions?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setTransactions(data.transactions || []);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string, hoursChange: number) => {
    if (hoursChange > 0) {
      return <Plus className="h-4 w-4 text-emerald-600" />;
    } else {
      return <Minus className="h-4 w-4 text-red-600" />;
    }
  };

  const getTransactionColor = (type: string, _hoursChange: number) => {
    switch (type) {
      case 'purchase':
        return 'bg-emerald-100 text-emerald-800';
      case 'booking':
        return 'bg-teal-100 text-teal-800';
      case 'refund':
        return 'bg-blue-100 text-blue-800';
      case 'adjustment':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Purchase';
      case 'booking':
        return 'Lesson Booking';
      case 'refund':
        return 'Refund';
      case 'adjustment':
        return 'Adjustment';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilterType(newFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <Alert className="border-red-300 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Transaction History Section */}
      <div className="space-y-6">
          {/* Header & Filters */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
              <CardTitle className="flex items-center space-x-3 text-xl font-bold">
                <div className="p-2 bg-white/20 rounded-full">
                  <History className="h-6 w-6" />
                </div>
                <span>Transaction History</span>
              </CardTitle>
              <CardDescription className="text-emerald-100">
                View all changes to your quota balance
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-100 rounded-full">
                    <Filter className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="font-semibold text-emerald-700">Filter by type:</span>
                </div>
                <Select value={filterType} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-full sm:w-64 h-12 rounded-xl border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="purchase">Purchases</SelectItem>
                    <SelectItem value="booking">Bookings</SelectItem>
                    <SelectItem value="refund">Refunds</SelectItem>
                    <SelectItem value="adjustment">Adjustments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transaction List */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
                  <span className="text-gray-600 font-medium">Loading transactions...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <History className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No transactions found</h3>
                  <p className="text-gray-500">
                    {filterType === 'all' 
                      ? 'Your quota transactions will appear here'
                      : `No ${filterType} transactions found`
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {transactions.map((transaction) => {
                    const { date, time } = formatDate(transaction.created_at);
                    const isPositive = transaction.hours_change > 0;
                    
                    return (
                      <div
                        key={transaction.id}
                        className="p-6 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            {/* Transaction Icon */}
                            <div className={`p-3 rounded-xl shadow-sm ${
                              isPositive ? 'bg-emerald-100' : 'bg-red-100'
                            }`}>
                              {getTransactionIcon(transaction.transaction_type, transaction.hours_change)}
                            </div>
                            
                            {/* Transaction Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                                <h4 className="font-bold text-gray-900 text-lg">
                                  {transaction.description}
                                </h4>
                                <Badge className={`${getTransactionColor(transaction.transaction_type, transaction.hours_change)} px-3 py-1 rounded-full font-medium w-fit`}>
                                  {getTransactionTypeLabel(transaction.transaction_type)}
                                </Badge>
                              </div>
                              
                              {/* Additional Details */}
                              <div className="space-y-2">
                                {transaction.packages && (
                                  <div className="flex items-center space-x-2">
                                    <Package className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600 font-medium">
                                      Package: {transaction.packages.name} ({transaction.packages.hours} hours)
                                    </span>
                                  </div>
                                )}
                                
                                {transaction.bookings && (
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600 font-medium">
                                      Lesson: {transaction.bookings.date} at {transaction.bookings.time}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {transaction.bookings.status}
                                    </Badge>
                                  </div>
                                )}
                                
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4" />
                                    <span className="font-medium">{date} at {time}</span>
                                  </div>
                                  {transaction.payment_id && (
                                    <div className="flex items-center space-x-2">
                                      <CreditCard className="h-4 w-4" />
                                      <span className="font-medium">ID: {transaction.payment_id.slice(-8)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Hours Change */}
                          <div className="text-right ml-4">
                            <div className={`text-2xl font-bold mb-1 ${
                              isPositive ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {isPositive ? '+' : ''}{transaction.hours_change}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">hours</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-600 font-medium">
                    Showing {((pagination.current_page - 1) * pagination.limit) + 1} to {Math.min(pagination.current_page * pagination.limit, pagination.total_count)} of {pagination.total_count} transactions
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={!pagination.has_prev}
                      className="h-10 px-4 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(
                          pagination.current_page - 2 + i,
                          pagination.total_pages - 4 + i
                        ));
                        
                        if (pageNum > pagination.total_pages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.current_page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-10 h-10 rounded-xl font-semibold ${
                              pageNum === pagination.current_page 
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg' 
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={!pagination.has_next}
                      className="h-10 px-4 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}