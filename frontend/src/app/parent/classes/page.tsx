'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  XCircle,
  CheckCircle
} from 'lucide-react'
import axios from 'axios'
import { format, isPast } from 'date-fns'

interface Class {
  id: number
  teacher_first_name: string
  teacher_last_name: string
  student_first_name: string
  student_last_name: string
  subject: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  price_per_lesson: number
}

export default function ParentClasses() {
  const router = useRouter()
  const { toast } = useToast()
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    studentId: ''
  })
  const [students, setStudents] = useState<{id: number, name: string}[]>([])

  useEffect(() => {
    fetchClassesAndStudents()
  }, [])

  const fetchClassesAndStudents = async () => {
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

      // Fetch students
      const studentsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students`,
        config
      )
      
      setStudents(studentsResponse.data.map((student: any) => ({
        id: student.id,
        name: `${student.first_name} ${student.last_name}`
      })))

      // Fetch classes
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const classesResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes?${params.toString()}`,
        config
      )
      
      setClasses(classesResponse.data)
      setIsLoading(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load classes',
        variant: 'destructive'
      })
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = () => {
    fetchClassesAndStudents()
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

      fetchClassesAndStudents()
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

  // Group classes by status
  const upcomingClasses = classes.filter(c => c.status === 'scheduled' && !isPast(new Date(c.end_time)))
  const pastClasses = classes.filter(c => c.status === 'completed' || (c.status === 'scheduled' && isPast(new Date(c.end_time))))
  const cancelledClasses = classes.filter(c => c.status === 'cancelled')

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Classes</h1>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger id="status">
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
              <Label htmlFor="studentId">Student</Label>
              <Select 
                value={filters.studentId}
                onValueChange={(value) => handleFilterChange('studentId', value)}
              >
                <SelectTrigger id="studentId">
                  <SelectValue placeholder="All students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All students</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.name}
                    </SelectItem>
                  ))}
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

          <Button className="mt-4" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      {/* Class Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingClasses.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastClasses.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelledClasses.length})
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Upcoming Classes */}
            <TabsContent value="upcoming">
              {upcomingClasses.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-center text-muted-foreground">
                      No upcoming classes. Book a class to get started!
                    </p>
                    <div className="flex justify-center mt-4">
                      <Button onClick={() => router.push('/parent/teachers')}>
                        Find a Teacher
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {upcomingClasses.map((classItem) => (
                    <Card key={classItem.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">
                                {classItem.subject}
                              </h3>
                              {getStatusBadge(classItem.status)}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                Student: {classItem.student_first_name} {classItem.student_last_name}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                Teacher: {classItem.teacher_first_name} {classItem.teacher_last_name}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(classItem.start_time), 'EEEE, MMMM d, yyyy')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(new Date(classItem.start_time), 'h:mm a')} - {format(new Date(classItem.end_time), 'h:mm a')}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Price</p>
                              <p className="text-lg font-semibold">R{classItem.price_per_lesson}</p>
                            </div>

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelClass(classItem.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Past Classes */}
            <TabsContent value="past">
              {pastClasses.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-center text-muted-foreground">
                      No past classes yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pastClasses.map((classItem) => (
                    <Card key={classItem.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">
                                {classItem.subject}
                              </h3>
                              {getStatusBadge(classItem.status)}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                Student: {classItem.student_first_name} {classItem.student_last_name}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                Teacher: {classItem.teacher_first_name} {classItem.teacher_last_name}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(classItem.start_time), 'EEEE, MMMM d, yyyy')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(new Date(classItem.start_time), 'h:mm a')} - {format(new Date(classItem.end_time), 'h:mm a')}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Price</p>
                            <p className="text-lg font-semibold">R{classItem.price_per_lesson}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Cancelled Classes */}
            <TabsContent value="cancelled">
              {cancelledClasses.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-center text-muted-foreground">
                      No cancelled classes.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {cancelledClasses.map((classItem) => (
                    <Card key={classItem.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">
                                {classItem.subject}
                              </h3>
                              {getStatusBadge(classItem.status)}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                Student: {classItem.student_first_name} {classItem.student_last_name}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                Teacher: {classItem.teacher_first_name} {classItem.teacher_last_name}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(classItem.start_time), 'EEEE, MMMM d, yyyy')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(new Date(classItem.start_time), 'h:mm a')} - {format(new Date(classItem.end_time), 'h:mm a')}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Price</p>
                            <p className="text-lg font-semibold">R{classItem.price_per_lesson}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Action Button */}
      <div className="mt-8 flex justify-center">
        <Button onClick={() => router.push('/parent/book-class')}>
          Book a New Class
        </Button>
      </div>
    </div>
  )
}
