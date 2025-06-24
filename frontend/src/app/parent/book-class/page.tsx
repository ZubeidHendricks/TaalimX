'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  GraduationCap, 
  MapPin, 
  DollarSign,
  Star,
  ArrowLeft,
  CheckCircle
} from 'lucide-react'
import axios from 'axios'
import { format, addDays } from 'date-fns'

interface Teacher {
  id: number
  first_name: string
  last_name: string
  email: string
  subjects: string[]
  average_rating: number
  total_classes: number
  hourly_rate: number
  qualifications: Array<{
    institution: string
    qualification: string
    year_completed: number
  }>
}

interface Student {
  id: number
  first_name: string
  last_name: string
  arabic_recitation_level: string
}

interface TimeSlot {
  start: string
  end: string
}

export default function BookClass() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [bookingInProgress, setBookingInProgress] = useState(false)
  
  const [bookingDetails, setBookingDetails] = useState({
    teacherId: parseInt(searchParams.get('teacher') || '0'),
    studentId: parseInt(searchParams.get('student') || '0'),
    subject: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    timeSlot: '',
    price: 0
  })

  const subjects = [
    'Quran Recitation',
    'Tajweed',
    'Islamic Studies',
    'Arabic Language',
    'Hadith Studies',
    'Fiqh',
    'Seerah'
  ]

  useEffect(() => {
    fetchInitialData()
  }, [searchParams])

  const fetchInitialData = async () => {
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
      setStudents(studentsResponse.data)

      // Fetch teacher details if teacher ID is provided
      const teacherId = searchParams.get('teacher')
      if (teacherId) {
        const teacherResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/search/teachers/${teacherId}`,
          config
        )
        
        setTeacher(teacherResponse.data)
        
        // Pre-fill pricing
        setBookingDetails(prev => ({
          ...prev,
          price: teacherResponse.data.hourly_rate || 0
        }))

        // Fetch availability for today
        fetchAvailability(teacherId, bookingDetails.date)
      }

      setIsLoading(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load initial data',
        variant: 'destructive'
      })
      setIsLoading(false)
    }
  }

  const fetchAvailability = async (teacherId: string, date: string) => {
    try {
      setLoadingSlots(true)
      const token = localStorage.getItem('token')
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/search/teachers/${teacherId}/availability?date=${date}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      setAvailableSlots(response.data.availableSlots)
      setLoadingSlots(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch teacher availability',
        variant: 'destructive'
      })
      setLoadingSlots(false)
      setAvailableSlots([])
    }
  }

  const handleBookingDetailChange = (field: string, value: string | number) => {
    setBookingDetails(prev => ({
      ...prev,
      [field]: value
    }))

    // Fetch availability when date changes
    if (field === 'date' && typeof value === 'string') {
      fetchAvailability(bookingDetails.teacherId.toString(), value)
    }
  }

  const handleBookClass = async () => {
    // Validate booking details
    if (!bookingDetails.studentId) {
      toast({
        title: 'Error',
        description: 'Please select a student',
        variant: 'destructive'
      })
      return
    }

    if (!bookingDetails.subject) {
      toast({
        title: 'Error',
        description: 'Please select a subject',
        variant: 'destructive'
      })
      return
    }

    if (!bookingDetails.timeSlot) {
      toast({
        title: 'Error',
        description: 'Please select a time slot',
        variant: 'destructive'
      })
      return
    }

    try {
      setBookingInProgress(true)
      const token = localStorage.getItem('token')
      
      // Parse time slot
      const [startTime, endTime] = bookingDetails.timeSlot.split('|')

      // Create class
      const classResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes`,
        {
          teacherId: bookingDetails.teacherId,
          studentId: bookingDetails.studentId,
          subject: bookingDetails.subject,
          scheduledDate: bookingDetails.date,
          startTime,
          endTime,
          pricePerLesson: bookingDetails.price
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      // Store class ID for payment
      localStorage.setItem('pendingClassId', classResponse.data.id.toString())
      
      // Create PayPal payment order
      const orderResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/create-payment-order`,
        { classId: classResponse.data.id },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      if (orderResponse.data.approvalUrl) {
        // Redirect to PayPal for payment approval
        window.location.href = orderResponse.data.approvalUrl
      } else {
        throw new Error('Failed to create PayPal payment order')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to book class',
        variant: 'destructive'
      })
      setBookingInProgress(false)
    }
  }

  const renderRating = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      )
    }
    return <div className="flex">{stars}</div>
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <h1 className="text-3xl font-bold mb-8">Book a Class</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Teacher Details */}
        <div className="lg:col-span-2">
          {teacher ? (
            <Card>
              <CardHeader>
                <CardTitle>Teacher Details</CardTitle>
                <CardDescription>You're booking a class with this teacher</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  {/* Teacher Info */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{teacher.first_name} {teacher.last_name}</h2>
                    
                    <div className="flex items-center gap-2 mt-2">
                      {renderRating(teacher.average_rating || 4.5)}
                      <span className="text-sm text-muted-foreground">
                        ({teacher.total_classes || 0} classes)
                      </span>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>R{teacher.hourly_rate}/hour</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>Online Classes</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-sm font-semibold mb-2">Subjects:</h3>
                      <div className="flex flex-wrap gap-2">
                        {teacher.subjects?.map((subject) => (
                          <Badge key={subject} variant="outline">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Qualifications */}
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold mb-2">Qualifications:</h3>
                    <div className="space-y-3">
                      {teacher.qualifications?.map((qual, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <GraduationCap className="h-4 w-4 mt-1 text-primary" />
                          <div>
                            <p className="font-medium">{qual.qualification}</p>
                            <p className="text-sm text-muted-foreground">
                              {qual.institution} ({qual.year_completed})
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-10">
                <p className="text-center text-muted-foreground">
                  Please select a teacher to book a class with
                </p>
                <div className="flex justify-center mt-4">
                  <Button onClick={() => router.push('/parent/teachers')}>
                    Browse Teachers
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Booking Form */}
          {teacher && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Class Details</CardTitle>
                <CardDescription>Select your preferences for this class</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Student Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="student">Student</Label>
                    <Select 
                      value={bookingDetails.studentId.toString()} 
                      onValueChange={(value) => handleBookingDetailChange('studentId', parseInt(value))}
                    >
                      <SelectTrigger id="student">
                        <SelectValue placeholder="Select student" />
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

                  {/* Subject Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select 
                      value={bookingDetails.subject} 
                      onValueChange={(value) => handleBookingDetailChange('subject', value)}
                    >
                      <SelectTrigger id="subject">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={bookingDetails.date}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      max={format(addDays(new Date(), 30), 'yyyy-MM-dd')}
                      onChange={(e) => handleBookingDetailChange('date', e.target.value)}
                    />
                  </div>

                  {/* Time Slot Selection */}
                  <div className="space-y-2">
                    <Label>Available Time Slots</Label>
                    
                    {loadingSlots ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-center py-4 text-muted-foreground">
                        No slots available on this date. Please try another date.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {availableSlots.map((slot, index) => (
                          <Button
                            key={index}
                            variant={bookingDetails.timeSlot === `${slot.start}|${slot.end}` ? 'default' : 'outline'}
                            className="py-6"
                            onClick={() => handleBookingDetailChange('timeSlot', `${slot.start}|${slot.end}`)}
                          >
                            {format(new Date(slot.start), 'h:mm a')}
                            {bookingDetails.timeSlot === `${slot.start}|${slot.end}` && (
                              <CheckCircle className="h-4 w-4 ml-2" />
                            )}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <Label htmlFor="price">Price per Lesson (ZAR)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="10"
                      value={bookingDetails.price}
                      onChange={(e) => handleBookingDetailChange('price', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Booking Summary */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
              <CardDescription>Review your booking details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {teacher ? (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Teacher</h3>
                    <p className="font-medium">{teacher.first_name} {teacher.last_name}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Student</h3>
                    <p className="font-medium">
                      {bookingDetails.studentId ? 
                        students.find(s => s.id === bookingDetails.studentId)?.first_name + ' ' + 
                        students.find(s => s.id === bookingDetails.studentId)?.last_name :
                        'Select a student'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Subject</h3>
                    <p className="font-medium">{bookingDetails.subject || 'Select a subject'}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
                    <p className="font-medium">
                      {format(new Date(bookingDetails.date), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>

                  {bookingDetails.timeSlot && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Time</h3>
                      <p className="font-medium">
                        {format(new Date(bookingDetails.timeSlot.split('|')[0]), 'h:mm a')} - {format(new Date(bookingDetails.timeSlot.split('|')[1]), 'h:mm a')}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <div className="flex justify-between">
                      <h3 className="font-semibold">Total</h3>
                      <p className="font-bold text-lg">R{bookingDetails.price}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Secure payment via PayPal
                    </p>
                  </div>

                  <Button 
                    className="w-full mt-6" 
                    onClick={handleBookClass}
                    disabled={
                      bookingInProgress || 
                      !bookingDetails.studentId || 
                      !bookingDetails.subject || 
                      !bookingDetails.timeSlot
                    }
                  >
                    {bookingInProgress ? 'Processing...' : 'Book Class & Pay with PayPal'}
                  </Button>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Select a teacher to see booking summary
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
