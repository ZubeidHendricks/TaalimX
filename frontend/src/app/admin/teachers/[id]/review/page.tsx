'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  GraduationCap, 
  Calendar,
  CreditCard,
  Shield,
  Download,
  ArrowLeft
} from 'lucide-react'
import axios from 'axios'
import { format } from 'date-fns'

interface Teacher {
  id: number
  first_name: string
  last_name: string
  email: string
  phone_number: string
  id_number: string
  address: string
  drivers_license_number: string
  drivers_license_expiry: string
  police_clearance_number: string
  police_clearance_expiry: string
  cv_url: string
  status: string
  created_at: string
}

interface Qualification {
  id: number
  institution: string
  qualification: string
  year_completed: number
}

export default function TeacherReviewPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { checkRole } = useAuth()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [qualifications, setQualifications] = useState<Qualification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchTeacherDetails()
  }, [params.id])

  const fetchTeacherDetails = async () => {
    try {
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }

      // Fetch teacher details
      const teacherResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/teachers/${params.id}`,
        config
      )
      setTeacher(teacherResponse.data.teacher)
      setQualifications(teacherResponse.data.qualifications)
      setIsLoading(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch teacher details',
        variant: 'destructive'
      })
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    try {
      setIsSubmitting(true)
      const token = localStorage.getItem('token')
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/teachers/${params.id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast({
        title: 'Success',
        description: 'Teacher approved successfully',
      })

      router.push('/admin/dashboard')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve teacher',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem('token')
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/teachers/${params.id}/reject`,
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast({
        title: 'Success',
        description: 'Teacher application rejected',
      })

      router.push('/admin/dashboard')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject teacher application',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Teacher not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push('/admin/dashboard')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic details about the teacher</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{teacher.first_name} {teacher.last_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{teacher.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone Number</Label>
                  <p className="font-medium">{teacher.phone_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">ID Number</Label>
                  <p className="font-medium">{teacher.id_number}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium">{teacher.address || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentation */}
          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>Uploaded documents and clearances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-primary" />
                      <h4 className="font-medium">Driver's License</h4>
                    </div>
                    {teacher.drivers_license_number && (
                      <Badge variant="outline">Valid</Badge>
                    )}
                  </div>
                  {teacher.drivers_license_number ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Number: {teacher.drivers_license_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Expiry: {format(new Date(teacher.drivers_license_expiry), 'PPP')}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not provided</p>
                  )}
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-primary" />
                      <h4 className="font-medium">Police Clearance</h4>
                    </div>
                    {teacher.police_clearance_number && (
                      <Badge variant="outline">Valid</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Number: {teacher.police_clearance_number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expiry: {format(new Date(teacher.police_clearance_expiry), 'PPP')}
                  </p>
                </div>

                {teacher.cv_url && (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-primary" />
                        <h4 className="font-medium">CV/Resume</h4>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}${teacher.cv_url}`, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download CV
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Qualifications */}
          <Card>
            <CardHeader>
              <CardTitle>Qualifications</CardTitle>
              <CardDescription>Educational background and certifications</CardDescription>
            </CardHeader>
            <CardContent>
              {qualifications.length > 0 ? (
                <div className="space-y-4">
                  {qualifications.map((qualification) => (
                    <div key={qualification.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <GraduationCap className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-medium">{qualification.qualification}</h4>
                        <p className="text-sm text-muted-foreground">{qualification.institution}</p>
                        <p className="text-sm text-muted-foreground">Completed: {qualification.year_completed}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No qualifications added</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Panel - Right Side */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
              <CardDescription>Current status and actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Badge 
                  variant={teacher.status === 'pending' ? 'warning' : 'default'}
                  className="text-lg py-1 px-3"
                >
                  {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
                </Badge>
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-sm text-muted-foreground">
                  Applied on: {format(new Date(teacher.created_at), 'PPP')}
                </p>
              </div>

              {teacher.status === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rejection-reason">Rejection Reason (if applicable)</Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="Provide a reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={handleApprove}
                      disabled={isSubmitting}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleReject}
                      disabled={isSubmitting}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interview Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Interview Notes</CardTitle>
              <CardDescription>Add notes from the interview process</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add interview notes here..."
                className="mb-4"
                rows={5}
              />
              <Button className="w-full">
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
