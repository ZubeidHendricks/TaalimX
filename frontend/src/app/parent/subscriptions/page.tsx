'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { 
  Calendar,
  Users,
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import axios from 'axios'

interface Student {
  id: number
  first_name: string
  last_name: string
  arabic_recitation_level: string
}

interface SubscriptionPlan {
  id: number
  name: string
  description: string
  price_per_lesson: number
  frequency: string
  teacher_first_name: string
  teacher_last_name: string
  teacher_id: number
}

interface Subscription {
  id: number
  plan_name: string
  plan_description: string
  price_per_lesson: number
  frequency: string
  status: string
  student_first_name: string
  student_last_name: string
  teacher_first_name: string
  teacher_last_name: string
  start_date: string
  activated_at?: string
  cancelled_at?: string
  paypal_subscription_id: string
}

export default function ParentSubscriptions() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false)

  useEffect(() => {
    fetchData()
    
    // Handle PayPal return
    const status = searchParams.get('status')
    const subscriptionId = searchParams.get('subscription_id')
    
    if (status === 'success' && subscriptionId) {
      handlePayPalReturn(subscriptionId)
    } else if (status === 'cancelled') {
      toast({
        title: 'Subscription Cancelled',
        description: 'You cancelled the subscription setup. No charges were made.',
        variant: 'destructive'
      })
    }
  }, [searchParams])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.push('/sign-in')
        return
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const [subscriptionsResponse, studentsResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions`, config),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/students`, config)
      ])

      setSubscriptions(subscriptionsResponse.data)
      setStudents(studentsResponse.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load subscription data',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayPalReturn = async (subscriptionId: string) => {
    try {
      const token = localStorage.getItem('token')
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/activate-subscription`,
        { subscriptionId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast({
        title: 'Subscription Activated!',
        description: 'Your subscription has been successfully activated.',
      })

      fetchData()
    } catch (error) {
      toast({
        title: 'Activation Error',
        description: 'There was an error activating your subscription.',
        variant: 'destructive'
      })
    }
  }

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!selectedStudent) {
      toast({
        title: 'Error',
        description: 'Please select a student',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsCreatingSubscription(true)
      const token = localStorage.getItem('token')
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/create-subscription`,
        {
          planId: plan.id,
          studentId: parseInt(selectedStudent),
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Start tomorrow
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.approvalUrl) {
        // Redirect to PayPal for subscription approval
        window.location.href = response.data.approvalUrl
      } else {
        throw new Error('No approval URL received')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create subscription',
        variant: 'destructive'
      })
    } finally {
      setIsCreatingSubscription(false)
    }
  }

  const handleCancelSubscription = async (subscription: Subscription) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/cancel-subscription`,
        {
          subscriptionId: subscription.paypal_subscription_id,
          reason: 'User requested cancellation'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription has been cancelled successfully.',
      })

      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      suspended: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active')
  const totalMonthlyPayment = activeSubscriptions.reduce((sum, sub) => {
    const multiplier = sub.frequency === 'week' ? 4 : 1
    return sum + (sub.price_per_lesson * multiplier)
  }, 0)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Subscriptions</h1>
          <p className="text-muted-foreground">Manage your recurring class subscriptions</p>
        </div>
        
        <Button onClick={() => router.push('/parent/teachers')}>
          Browse Teachers
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                <p className="text-2xl font-bold">{activeSubscriptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Monthly Payment</p>
                <p className="text-2xl font-bold">R{totalMonthlyPayment.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Subscriptions</p>
                <p className="text-2xl font-bold">{subscriptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Subscriptions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Subscriptions</CardTitle>
          <CardDescription>Manage your recurring class subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No subscriptions yet</p>
              <Button onClick={() => router.push('/parent/teachers')}>
                Browse Teachers
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{subscription.plan_name}</h3>
                        {getStatusBadge(subscription.status)}
                      </div>
                      <p className="text-muted-foreground mb-3">{subscription.plan_description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Student</p>
                          <p className="font-medium">{subscription.student_first_name} {subscription.student_last_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Teacher</p>
                          <p className="font-medium">{subscription.teacher_first_name} {subscription.teacher_last_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Price</p>
                          <p className="font-medium">R{subscription.price_per_lesson} per {subscription.frequency}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Start Date</p>
                          <p className="font-medium">{new Date(subscription.start_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {subscription.status === 'active' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCancelSubscription(subscription)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscribe Dialog */}
      <Dialog open={showSubscribeDialog} onOpenChange={setShowSubscribeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscribe to Plan</DialogTitle>
            <DialogDescription>
              Set up a recurring subscription for regular classes
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold">{selectedPlan.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{selectedPlan.description}</p>
                <p className="font-medium">R{selectedPlan.price_per_lesson} per {selectedPlan.frequency}</p>
                <p className="text-sm text-muted-foreground">
                  Teacher: {selectedPlan.teacher_first_name} {selectedPlan.teacher_last_name}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Student</label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.first_name} {student.last_name} ({student.arabic_recitation_level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  <p className="text-sm font-medium">Payment Information</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  You will be redirected to PayPal to set up your recurring payment. 
                  Your first payment will be processed tomorrow.
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSubscribeDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleSubscribe(selectedPlan)}
                  disabled={isCreatingSubscription || !selectedStudent}
                >
                  {isCreatingSubscription ? 'Setting up...' : 'Subscribe with PayPal'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}