'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import axios from 'axios'
import { format } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

interface MonthlyEarning {
  month: string
  lesson_count: number
  total_earned: string
  paid_amount: string
  pending_amount: string
}

interface Payment {
  id: number
  amount: number
  payment_date: string
  status: 'pending' | 'completed' | 'failed'
  subject: string
  student_first_name: string
  student_last_name: string
  class_date: string
}

export default function TeacherEarnings() {
  const router = useRouter()
  const { toast } = useToast()
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  })

  useEffect(() => {
    fetchEarningsData()
  }, [])

  const fetchEarningsData = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.push('/sign-in')
        return
      }

      // Fetch monthly earnings summary
      const earningsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/teachers/earnings`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setMonthlyEarnings(earningsResponse.data)

      // Fetch payment history
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const paymentsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/history?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setPayments(paymentsResponse.data)

      setIsLoading(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch earnings data',
        variant: 'destructive'
      })
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = () => {
    fetchEarningsData()
  }

  const downloadEarningsCsv = () => {
    // Create CSV content
    const headers = ['Month', 'Lessons', 'Total Earned', 'Paid Amount', 'Pending Amount']
    const rows = monthlyEarnings.map(earning => [
      format(new Date(earning.month), 'MMMM yyyy'),
      earning.lesson_count,
      `R${parseFloat(earning.total_earned).toFixed(2)}`,
      `R${parseFloat(earning.paid_amount).toFixed(2)}`,
      `R${parseFloat(earning.pending_amount).toFixed(2)}`
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `teacher_earnings_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Format data for chart
  const chartData = monthlyEarnings.map(earning => ({
    name: format(new Date(earning.month), 'MMM yyyy'),
    Paid: parseFloat(earning.paid_amount),
    Pending: parseFloat(earning.pending_amount)
  })).reverse().slice(0, 6) // Show last 6 months

  // Calculate summary statistics
  const totalEarned = monthlyEarnings.reduce(
    (sum, earning) => sum + parseFloat(earning.total_earned), 0
  ).toFixed(2)
  
  const totalPending = monthlyEarnings.reduce(
    (sum, earning) => sum + parseFloat(earning.pending_amount), 0
  ).toFixed(2)
  
  const totalLessons = monthlyEarnings.reduce(
    (sum, earning) => sum + earning.lesson_count, 0
  )

  // Get current month earnings
  const currentMonth = new Date().toISOString().substring(0, 7) // YYYY-MM format
  const currentMonthEarnings = monthlyEarnings.find(
    earning => earning.month.startsWith(currentMonth)
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Earnings Dashboard</h1>

      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{totalEarned}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalLessons} lessons completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{currentMonthEarnings?.total_earned || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonthEarnings?.lesson_count || 0} lessons this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{totalPending}
            </div>
            <p className="text-xs text-muted-foreground">
              Will be processed soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Per Lesson</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{totalLessons > 0 ? (parseFloat(totalEarned) / totalLessons).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Average price per lesson
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Monthly Earnings Trend</CardTitle>
          <CardDescription>Past 6 months of earnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`R${value}`, '']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Bar dataKey="Paid" fill="#10b981" stackId="a" />
                <Bar dataKey="Pending" fill="#f59e0b" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadEarningsCsv}
            >
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Detailed view of your payments</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <Button className="mb-6" onClick={handleApplyFilters}>
            Apply Filters
          </Button>

          {/* Payment List */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payments found matching your filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Date</th>
                    <th className="text-left py-3 px-2 font-medium">Student</th>
                    <th className="text-left py-3 px-2 font-medium">Subject</th>
                    <th className="text-left py-3 px-2 font-medium">Class Date</th>
                    <th className="text-left py-3 px-2 font-medium">Amount</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        {format(new Date(payment.payment_date), 'PPP')}
                      </td>
                      <td className="py-3 px-2">
                        {payment.student_first_name} {payment.student_last_name}
                      </td>
                      <td className="py-3 px-2">
                        {payment.subject}
                      </td>
                      <td className="py-3 px-2">
                        {format(new Date(payment.class_date), 'PPP')}
                      </td>
                      <td className="py-3 px-2 font-medium">
                        R{payment.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-2">
                        {payment.status === 'completed' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </span>
                        ) : payment.status === 'pending' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
