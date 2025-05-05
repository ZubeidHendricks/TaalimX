'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import axios from 'axios'
import { format } from 'date-fns'

interface Class {
  id: number
  student_first_name: string
  student_last_name: string
  parent_first_name: string
  parent_last_name: string
  parent_phone: string
  subject: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  price_per_lesson: number
}

export default function TeacherClasses() {
  const router = useRouter()
  const { toast } = useToast()
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    search: ''
  })

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.push('/sign-in')
        return
      }

      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/teachers/classes?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      setClasses(response.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch classes',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    fetchClasses()
  }

  const handleCompleteClass = async (classId: number) => {
    try {
      const token = localStorage.getItem('token')
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/${classId}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      toast({
        title: 'Success',
        description: 'Class marked as completed',
      })

      fetchClasses()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete class',
        variant: 'destructive'
      })
    }
  }

  const handleCancelClass = async (classId: number) => {
    try {
      const token = localStorage.getItem('token')
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/${classId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      toast({
        title: 'Success',
        description: 'Class cancelled successfully',
      })

      fetchClasses()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel class',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge>Scheduled</Badge>
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Classes</h1>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filter Classes</CardTitle>
          <CardDescription>Search and filter your classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Student name or subject..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

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
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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

          <Button className="mt-4 w-full md:w-auto" onClick={handleSearch}>
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      {/* Classes List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No classes found matching your criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {classes.map((classItem) => (
            <Card key={classItem.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="space-y-1 md:space-y-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {classItem.student_first_name} {classItem.student_last_name}
                      </h3>
                      {getStatusBadge(classItem.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {classItem.subject}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(classItem.start_time), 'PPP')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(classItem.start_time), 'p')} - {format(new Date(classItem.end_time), 'p')}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Parent: {classItem.parent_first_name} {classItem.parent_last_name}
                      </div>
                      <div className="flex items-center gap-1">
                        {classItem.parent_phone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4 md:mt-0">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="text-lg font-semibold">R{classItem.price_per_lesson}</p>
                    </div>

                    {classItem.status === 'scheduled' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleCompleteClass(classItem.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelClass(classItem.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes.filter(c => c.status === 'scheduled').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes.filter(c => {
                const classDate = new Date(c.start_time)
                const now = new Date()
                return c.status === 'completed' && 
                       classDate.getMonth() === now.getMonth() && 
                       classDate.getFullYear() === now.getFullYear()
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{classes.filter(c => c.status === 'completed')
                 .reduce((sum, c) => sum + c.price_per_lesson, 0)
                 .toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
