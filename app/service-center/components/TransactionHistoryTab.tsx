'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Plus, Minus, CreditCard, Calendar, ChevronLeft, ChevronRight, Filter, Loader2, AlertCircle } from 'lucide-react';
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
      return <Plus className="h-4 w-4 text-green-600" />;
    } else {
      return <Minus className="h-4 w-4 text-red-600" />;
    }
  };

  const getTransactionColor = (type: string, _hoursChange: number) => {
    switch (type) {
      case 'purchase':
        return 'bg-green-100 text-green-800';
      case 'booking':
        return 'bg-blue-100 text-blue-800';
      case 'refund':
        return 'bg-purple-100 text-purple-800';
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
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Transaction History</span>
              </CardTitle>
              <CardDescription>
                View all changes to your quota balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Filter by type:</span>
                </div>
                <Select value={filterType} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-48">
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
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading transactions...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No transactions found</p>
                  <p className="text-sm text-gray-400">
                    {filterType === 'all' 
                      ? 'Your quota transactions will appear here'
                      : `No ${filterType} transactions found`
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {transactions.map((transaction, index) => {
                    const { date, time } = formatDate(transaction.created_at);
                    const isPositive = transaction.hours_change > 0;
                    
                    return (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="p-6 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            {/* Transaction Icon */}
                            <div className={`p-2 rounded-full ${
                              isPositive ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {getTransactionIcon(transaction.transaction_type, transaction.hours_change)}
                            </div>
                            
                            {/* Transaction Details */}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-semibold text-gray-900">
                                  {transaction.description}
                                </h4>
                                <Badge className={getTransactionColor(transaction.transaction_type, transaction.hours_change)}>
                                  {getTransactionTypeLabel(transaction.transaction_type)}
                                </Badge>
                              </div>
                              
                              {/* Additional Details */}
                              <div className="space-y-1">
                                {transaction.packages && (
                                  <p className="text-sm text-gray-600">
                                    Package: {transaction.packages.name} ({transaction.packages.hours} hours)
                                  </p>
                                )}
                                
                                {transaction.bookings && (
                                  <p className="text-sm text-gray-600">
                                    Lesson: {transaction.bookings.date} at {transaction.bookings.time}
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {transaction.bookings.status}
                                    </Badge>
                                  </p>
                                )}
                                
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{date} at {time}</span>
                                  </span>
                                  {transaction.payment_id && (
                                    <span className="flex items-center space-x-1">
                                      <CreditCard className="h-3 w-3" />
                                      <span>Payment ID: {transaction.payment_id.slice(-8)}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Hours Change */}
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              isPositive ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {isPositive ? '+' : ''}{transaction.hours_change} hours
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.current_page - 1) * pagination.limit) + 1} to {Math.min(pagination.current_page * pagination.limit, pagination.total_count)} of {pagination.total_count} transactions
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={!pagination.has_prev}
                    >
                      <ChevronLeft className="h-4 w-4" />
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
                            className="w-8 h-8 p-0"
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
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
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