'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { 
  Plus, 
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react'
import axios from 'axios'

interface SubscriptionPlan {
  id: number
  name: string
  description: string
  price_per_lesson: number
  frequency: string
  status: string
  active_subscriptions: number
  paypal_plan_id: string
  created_at: string
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
  parent_first_name: string
  parent_last_name: string
  start_date: string
  activated_at?: string
  cancelled_at?: string
}

export default function TeacherSubscriptions() {
  const { toast } = useToast()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingPlan, setIsCreatingPlan] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    pricePerLesson: '',
    frequency: 'week'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        return
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const [plansResponse, subscriptionsResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/plans`, config),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions`, config)
      ])

      setPlans(plansResponse.data)
      setSubscriptions(subscriptionsResponse.data)
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

  const handleCreatePlan = async () => {
    if (!newPlan.name || !newPlan.description || !newPlan.pricePerLesson) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsCreatingPlan(true)
      const token = localStorage.getItem('token')
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/create-plan`,
        {
          name: newPlan.name,
          description: newPlan.description,
          pricePerLesson: parseFloat(newPlan.pricePerLesson),
          frequency: newPlan.frequency
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      toast({
        title: 'Success',
        description: 'Subscription plan created successfully',
      })

      setShowCreateDialog(false)
      setNewPlan({ name: '', description: '', pricePerLesson: '', frequency: 'week' })
      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create subscription plan',
        variant: 'destructive'
      })
    } finally {
      setIsCreatingPlan(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const totalActiveSubscriptions = plans.reduce((sum, plan) => sum + plan.active_subscriptions, 0)
  const totalMonthlyRevenue = plans.reduce((sum, plan) => {
    const multiplier = plan.frequency === 'week' ? 4 : 1
    return sum + (plan.price_per_lesson * plan.active_subscriptions * multiplier)
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
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage your recurring class subscriptions</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Subscription Plan</DialogTitle>
              <DialogDescription>
                Create a new recurring subscription plan for your classes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="planName">Plan Name</Label>
                <Input
                  id="planName"
                  placeholder="e.g., Weekly Quran Classes"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="planDescription">Description</Label>
                <Textarea
                  id="planDescription"
                  placeholder="Describe what's included in this subscription plan"
                  value={newPlan.description}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerLesson">Price per Lesson (ZAR)</Label>
                  <Input
                    id="pricePerLesson"
                    type="number"
                    min="0"
                    step="10"
                    placeholder="150"
                    value={newPlan.pricePerLesson}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, pricePerLesson: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="frequency">Billing Frequency</Label>
                  <Select value={newPlan.frequency} onValueChange={(value) => setNewPlan(prev => ({ ...prev, frequency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Weekly</SelectItem>
                      <SelectItem value="month">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePlan} disabled={isCreatingPlan}>
                  {isCreatingPlan ? 'Creating...' : 'Create Plan'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                <p className="text-2xl font-bold">{totalActiveSubscriptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">R{totalMonthlyRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Plans</p>
                <p className="text-2xl font-bold">{plans.filter(p => p.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Plans */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Subscription Plans</CardTitle>
          <CardDescription>Manage your recurring class subscription plans</CardDescription>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No subscription plans created yet</p>
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Plan
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{plan.name}</h3>
                        {getStatusBadge(plan.status)}
                      </div>
                      <p className="text-muted-foreground mb-3">{plan.description}</p>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>R{plan.price_per_lesson} per {plan.frequency}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{plan.active_subscriptions} active subscribers</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Current Subscriptions</CardTitle>
          <CardDescription>Active subscriptions from your students</CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active subscriptions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{subscription.plan_name}</h3>
                        {getStatusBadge(subscription.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Student</p>
                          <p className="font-medium">{subscription.student_first_name} {subscription.student_last_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Parent</p>
                          <p className="font-medium">{subscription.parent_first_name} {subscription.parent_last_name}</p>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}