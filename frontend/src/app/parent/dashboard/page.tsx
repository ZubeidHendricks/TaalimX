'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Calendar, Users, PlusCircle, BookOpen, School } from 'lucide-react'
import axios from 'axios'
import { format } from 'date-fns'

interface Student {
  id: number
  first_name: string
  last_name: string
  date_of_birth: string
  school_name: string
  grade: string
  arabic_recitation_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

interface Class {
  id: number
  teacher_name: string
  subject: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  price_per_lesson: number
}

export default function ParentDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)

  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    schoolName: '',
    grade: '',
    arabicRecitationLevel: 'beginner'
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/sign-in')
        return
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setStudents(response.data)
      setIsLoading(false)
    } catch (error: any) {
      console.error('Dashboard error:', error)
      if (error.response?.status === 401) {
        router.push('/sign-in')
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load students',
          variant: 'destructive'
        })
      }
      setIsLoading(false)
    }
  }

  const handleAddStudent = async () => {
    try {
      const token = localStorage.getItem('token')
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students`,
        {
          firstName: newStudent.firstName,
          lastName: newStudent.lastName,
          dateOfBirth: newStudent.dateOfBirth,
          schoolName: newStudent.schoolName,
          grade: newStudent.grade,
          arabicRecitationLevel: newStudent.arabicRecitationLevel
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      toast({
        title: 'Success',
        description: 'Student added successfully',
      })

      setIsAddStudentOpen(false)
      setNewStudent({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        schoolName: '',
        grade: '',
        arabicRecitationLevel: 'beginner'
      })
      fetchStudents()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add student',
        variant: 'destructive'
      })
    }
  }

  const getRecitationLevelBadge = (level: string) => {
    switch (level) {
      case 'beginner':
        return <Badge variant="secondary">Beginner</Badge>
      case 'intermediate':
        return <Badge variant="secondary">Intermediate</Badge>
      case 'advanced':
        return <Badge>Advanced</Badge>
      case 'expert':
        return <Badge className="bg-green-500">Expert</Badge>
      default:
        return <Badge>{level}</Badge>
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
          <h1 className="text-3xl font-bold">Parent Dashboard</h1>
          <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Add your child's information to enroll them in madrasa classes.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newStudent.firstName}
                      onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newStudent.lastName}
                      onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={newStudent.dateOfBirth}
                    onChange={(e) => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name</Label>
                  <Input
                    id="schoolName"
                    value={newStudent.schoolName}
                    onChange={(e) => setNewStudent({ ...newStudent, schoolName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Input
                    id="grade"
                    value={newStudent.grade}
                    onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Arabic Recitation Level</Label>
                  <Select 
                    value={newStudent.arabicRecitationLevel}
                    onValueChange={(value) => setNewStudent({ ...newStudent, arabicRecitationLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddStudent} className="w-full">Add Student</Button>
            </DialogContent>
          </Dialog>
        </div>

        {students.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">No students added yet</h3>
                <p className="mt-2 text-gray-500">Add your children to start booking madrasa classes.</p>
                <Button 
                  className="mt-4"
                  onClick={() => setIsAddStudentOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Your First Student
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <Card key={student.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{student.first_name} {student.last_name}</span>
                    {getRecitationLevelBadge(student.arabic_recitation_level)}
                  </CardTitle>
                  <CardDescription>
                    Age: {format(new Date(), 'yyyy') - format(new Date(student.date_of_birth), 'yyyy')} years
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <School className="mr-2 h-4 w-4 text-gray-500" />
                      <span>{student.school_name || 'School not specified'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <BookOpen className="mr-2 h-4 w-4 text-gray-500" />
                      <span>Grade {student.grade || 'Not specified'}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => router.push(`/parent/students/${student.id}`)}
                    >
                      View Details
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => router.push(`/parent/book-class?student=${student.id}`)}
                    >
                      Book Class
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Find Teachers
              </CardTitle>
              <CardDescription>Browse available teachers for your children</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => router.push('/parent/teachers')}
              >
                Browse Teachers
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Upcoming Classes
              </CardTitle>
              <CardDescription>View and manage scheduled classes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/parent/classes')}
              >
                View Schedule
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Progress Reports
              </CardTitle>
              <CardDescription>Track your children's learning progress</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/parent/progress')}
              >
                View Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
