'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Calendar, Clock, DollarSign, Users, AlertCircle, CheckCircle2 } from 'lucide-react'
import axios from 'axios'
import { format } from 'date-fns'

interface TeacherProfile {
  id: number
  first_name: string
  last_name: string
  status: 'pending' | 'interviewed' | 'approved' | 'rejected'
  email: string
}

interface Class {
  id: number
  student_first_name: string
  student_last_name: string
  subject: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  price_per_lesson: number
}

interface Earnings {
  month: string
  lesson_count: number
  total_earned: string
  paid_amount: string
  pending_amount: string
}

export default function TeacherDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [upcomingClasses, setUpcomingClasses] = useState<Class[]>([])
  const [recentEarnings, setRecentEarnings] = useState<Earnings[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/sign-in')
        return
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      // Fetch profile
      const profileResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/teachers/profile`,
        config
      )
      setProfile(profileResponse.data)

      // Fetch upcoming classes
      const classesResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/teachers/classes?status=scheduled`,
        config
      )
      setUpcomingClasses(classesResponse.data.slice(0, 5)) // Get only the next 5 classes

      // Fetch earnings
      const earningsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/teachers/earnings`,
        config
      )
      setRecentEarnings(earningsResponse.data.slice(0, 3)) // Get last 3 months

      setIsLoading(false)
    } catch (error: any) {
      console.error('Dashboard error:', error)
      if (error.response?.status === 401) {
        router.push('/sign-in')
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive'
        })
      }
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: TeacherProfile['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500">Pending Verification</Badge>
      case 'interviewed':
        return <Badge className="bg-blue-500">Interview Complete</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          {profile && getStatusBadge(profile.status)}
        </div>

        {/* Status Alert */}
        {profile?.status === 'pending' && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <h3 className="font-medium text-yellow-800">Profile Under Review</h3>
                  <p className="text-yellow-700">Your profile is being reviewed by our team. You'll be notified once approved.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {profile?.status === 'approved' && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <h3 className="font-medium text-green-800">Profile Approved</h3>
                  <p className="text-green-700">You're all set to start teaching! Students can now book classes with you.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">This Month's Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {recentEarnings[0]?.lesson_count || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">This Month's Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R{parseFloat(recentEarnings[0]?.total_earned || '0').toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pending Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R{parseFloat(recentEarnings[0]?.pending_amount || '0').toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Upcoming Classes
              </CardTitle>
              <CardDescription>Your next scheduled lessons</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingClasses.length === 0 ? (
                <p className="text-gray-500">No upcoming classes scheduled</p>
              ) : (
                <div className="space-y-4">
                  {upcomingClasses.map((classItem) => (
                    <div key={classItem.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div>
                        <h4 className="font-medium">
                          {classItem.student_first_name} {classItem.student_last_name}
                        </h4>
                        <p className="text-sm text-gray-500">{classItem.subject}</p>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          {format(new Date(classItem.start_time), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R{classItem.price_per_lesson}</p>
                        <Badge variant="outline">{classItem.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Earnings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Recent Earnings
              </CardTitle>
              <CardDescription>Your earnings for the past months</CardDescription>
            </CardHeader>
            <CardContent>
              {recentEarnings.length === 0 ? (
                <p className="text-gray-500">No earnings data available</p>
              ) : (
                <div className="space-y-4">
                  {recentEarnings.map((earning) => (
                    <div key={earning.month} className="border-b pb-4 last:border-0">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">
                          {format(new Date(earning.month), 'MMMM yyyy')}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {earning.lesson_count} lessons
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Total</p>
                          <p className="font-medium">R{parseFloat(earning.total_earned).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Paid</p>
                          <p className="font-medium text-green-600">R{parseFloat(earning.paid_amount).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Pending</p>
                          <p className="font-medium text-yellow-600">R{parseFloat(earning.pending_amount).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Button onClick={() => router.push('/teacher/profile')}>
            <Users className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
          <Button variant="outline" onClick={() => router.push('/teacher/classes')}>
            <Calendar className="mr-2 h-4 w-4" />
            View All Classes
          </Button>
          <Button variant="outline" onClick={() => router.push('/teacher/earnings')}>
            <DollarSign className="mr-2 h-4 w-4" />
            View All Earnings
          </Button>
        </div>
      </div>
    </div>
  )
}
