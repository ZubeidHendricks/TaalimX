'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  Users, 
  DollarSign, 
  BookOpen, 
  UserCheck, 
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import axios from 'axios'
import { format } from 'date-fns'

interface DashboardStats {
  totalTeachers: number
  pendingTeachers: number
  approvedTeachers: number
  totalParents: number
  totalStudents: number
  totalClasses: number
  upcomingClasses: number
  totalRevenue: string
  monthlyRevenue: string
  pendingPayments: string
}

interface PendingTeacher {
  id: number
  first_name: string
  last_name: string
  email: string
  created_at: string
  qualification_count: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      
      if (!token || user.role !== 'admin') {
        router.push('/sign-in')
        return
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      // Fetch dashboard stats
      const statsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard-stats`,
        config
      )
      setStats(statsResponse.data)

      // Fetch pending teachers
      const teachersResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/pending-teachers`,
        config
      )
      setPendingTeachers(teachersResponse.data)

      setIsLoading(false)
    } catch (error: any) {
      console.error('Dashboard error:', error)
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      })
      setIsLoading(false)
    }
  }

  const handleApproveTeacher = async (teacherId: number) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/teachers/${teacherId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      toast({
        title: 'Success',
        description: 'Teacher approved successfully',
      })
      
      fetchDashboardData() // Refresh data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve teacher',
        variant: 'destructive'
      })
    }
  }

  const handleRejectTeacher = async (teacherId: number) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/teachers/${teacherId}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      toast({
        title: 'Success',
        description: 'Teacher rejected',
      })
      
      fetchDashboardData() // Refresh data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject teacher',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTeachers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingTeachers || 0} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalParents || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalStudents || 0} students registered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.upcomingClasses || 0} upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{stats?.monthlyRevenue || '0'}</div>
            <p className="text-xs text-muted-foreground">
              R{stats?.pendingPayments || '0'} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Teachers Section */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Teacher Approvals</CardTitle>
          <CardDescription>
            Review and approve new teacher applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingTeachers.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No pending teacher applications
            </p>
          ) : (
            <div className="space-y-4">
              {pendingTeachers.map((teacher) => (
                <div 
                  key={teacher.id} 
                  className="flex items-center justify-between border rounded-lg p-4"
                >
                  <div>
                    <h3 className="font-semibold">
                      {teacher.first_name} {teacher.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{teacher.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Applied: {format(new Date(teacher.created_at), 'PPP')}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {teacher.qualification_count} qualifications
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/admin/teachers/${teacher.id}/review`)}
                    >
                      Review
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApproveTeacher(teacher.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRejectTeacher(teacher.id)}
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage teachers, parents, and students</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full mb-2"
              onClick={() => router.push('/admin/teachers')}
            >
              Manage Teachers
            </Button>
            <Button 
              className="w-full mb-2"
              variant="outline"
              onClick={() => router.push('/admin/parents')}
            >
              Manage Parents
            </Button>
            <Button 
              className="w-full"
              variant="outline"
              onClick={() => router.push('/admin/students')}
            >
              Manage Students
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Reports</CardTitle>
            <CardDescription>View revenue and payment reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full mb-2"
              onClick={() => router.push('/admin/reports/revenue')}
            >
              Revenue Report
            </Button>
            <Button 
              className="w-full mb-2"
              variant="outline"
              onClick={() => router.push('/admin/reports/payments')}
            >
              Payment History
            </Button>
            <Button 
              className="w-full"
              variant="outline"
              onClick={() => router.push('/admin/reports/teachers')}
            >
              Teacher Earnings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Settings</CardTitle>
            <CardDescription>Configure platform settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full mb-2"
              onClick={() => router.push('/admin/settings/pricing')}
            >
              Pricing Settings
            </Button>
            <Button 
              className="w-full mb-2"
              variant="outline"
              onClick={() => router.push('/admin/settings/notifications')}
            >
              Notification Settings
            </Button>
            <Button 
              className="w-full"
              variant="outline"
              onClick={() => router.push('/admin/settings/security')}
            >
              Security Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
