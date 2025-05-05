'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Progress } from '@/components/ui/progress'
import { Upload, CheckCircle } from 'lucide-react'
import axios from 'axios'

interface StepProps {
  children: React.ReactNode
  isActive: boolean
}

const Step = ({ children, isActive }: StepProps) => {
  if (!isActive) return null
  return <div>{children}</div>
}

export default function TeacherOnboarding() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    idNumber: '',
    address: '',
    driversLicenseNumber: '',
    driversLicenseExpiry: '',
    policeClearanceNumber: '',
    policeClearanceExpiry: '',
    qualifications: [{ institution: '', qualification: '', yearCompleted: '' }]
  })

  const [files, setFiles] = useState({
    cv: null as File | null,
    policeClearance: null as File | null,
    id: null as File | null
  })

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [fileType]: e.target.files[0] })
    }
  }

  const addQualification = () => {
    setFormData({
      ...formData,
      qualifications: [
        ...formData.qualifications,
        { institution: '', qualification: '', yearCompleted: '' }
      ]
    })
  }

  const updateQualification = (index: number, field: string, value: string) => {
    const updatedQualifications = [...formData.qualifications]
    updatedQualifications[index] = { ...updatedQualifications[index], [field]: value }
    setFormData({ ...formData, qualifications: updatedQualifications })
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      
      // First update teacher profile
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/teachers/profile`,
        {
          idNumber: formData.idNumber,
          address: formData.address,
          driversLicenseNumber: formData.driversLicenseNumber,
          driversLicenseExpiry: formData.driversLicenseExpiry || null,
          policeClearanceNumber: formData.policeClearanceNumber,
          policeClearanceExpiry: formData.policeClearanceExpiry
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      // Add qualifications
      for (const qualification of formData.qualifications) {
        if (qualification.institution && qualification.qualification && qualification.yearCompleted) {
          await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/teachers/qualifications`,
            {
              institution: qualification.institution,
              qualification: qualification.qualification,
              yearCompleted: parseInt(qualification.yearCompleted)
            },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          )
        }
      }

      // Upload files
      if (files.cv) {
        const cvFormData = new FormData()
        cvFormData.append('file', files.cv)
        cvFormData.append('type', 'cv')
        
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/uploads/teacher-documents`,
          cvFormData,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        )
      }

      toast({
        title: 'Success',
        description: 'Your profile has been submitted for review!',
      })

      router.push('/teacher/dashboard')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to submit profile',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center mb-4">Complete Your Teacher Profile</h1>
            <Progress value={progress} className="h-2" />
            <p className="text-center mt-2 text-gray-600">Step {currentStep} of {totalSteps}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {currentStep === 1 && 'Personal Information'}
                {currentStep === 2 && 'Documentation'}
                {currentStep === 3 && 'Qualifications'}
                {currentStep === 4 && 'Review & Submit'}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && 'Please provide your personal identification details'}
                {currentStep === 2 && 'Upload required documentation for verification'}
                {currentStep === 3 && 'Add your educational qualifications'}
                {currentStep === 4 && 'Review your information before submitting'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step 1: Personal Information */}
              <Step isActive={currentStep === 1}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="idNumber">ID Number</Label>
                    <Input
                      id="idNumber"
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      placeholder="Enter your ID number"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter your address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="driversLicenseNumber">Driver's License Number</Label>
                      <Input
                        id="driversLicenseNumber"
                        value={formData.driversLicenseNumber}
                        onChange={(e) => setFormData({ ...formData, driversLicenseNumber: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="driversLicenseExpiry">Driver's License Expiry</Label>
                      <Input
                        id="driversLicenseExpiry"
                        type="date"
                        value={formData.driversLicenseExpiry}
                        onChange={(e) => setFormData({ ...formData, driversLicenseExpiry: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </Step>

              {/* Step 2: Documentation */}
              <Step isActive={currentStep === 2}>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="policeClearanceNumber">Police Clearance Number</Label>
                      <Input
                        id="policeClearanceNumber"
                        value={formData.policeClearanceNumber}
                        onChange={(e) => setFormData({ ...formData, policeClearanceNumber: e.target.value })}
                        placeholder="Enter police clearance number"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="policeClearanceExpiry">Police Clearance Expiry</Label>
                      <Input
                        id="policeClearanceExpiry"
                        type="date"
                        value={formData.policeClearanceExpiry}
                        onChange={(e) => setFormData({ ...formData, policeClearanceExpiry: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Upload CV/Resume</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          id="cv"
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileChange(e, 'cv')}
                        />
                        <label htmlFor="cv" className="cursor-pointer">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2">
                            {files.cv ? files.cv.name : 'Click to upload CV'}
                          </p>
                          <p className="text-sm text-gray-500">PDF, DOC up to 10MB</p>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Upload ID Document</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          id="id"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, 'id')}
                        />
                        <label htmlFor="id" className="cursor-pointer">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2">
                            {files.id ? files.id.name : 'Click to upload ID'}
                          </p>
                          <p className="text-sm text-gray-500">PDF, JPG, PNG up to 10MB</p>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </Step>

              {/* Step 3: Qualifications */}
              <Step isActive={currentStep === 3}>
                <div className="space-y-6">
                  {formData.qualifications.map((qualification, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <h3 className="font-medium">Qualification {index + 1}</h3>
                      <div className="space-y-2">
                        <Label>Institution</Label>
                        <Input
                          value={qualification.institution}
                          onChange={(e) => updateQualification(index, 'institution', e.target.value)}
                          placeholder="University/College name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Qualification</Label>
                        <Input
                          value={qualification.qualification}
                          onChange={(e) => updateQualification(index, 'qualification', e.target.value)}
                          placeholder="Degree/Certificate name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Year Completed</Label>
                        <Input
                          type="number"
                          value={qualification.yearCompleted}
                          onChange={(e) => updateQualification(index, 'yearCompleted', e.target.value)}
                          placeholder="YYYY"
                          min="1900"
                          max={new Date().getFullYear()}
                        />
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addQualification}>
                    Add Another Qualification
                  </Button>
                </div>
              </Step>

              {/* Step 4: Review */}
              <Step isActive={currentStep === 4}>
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <h3 className="font-medium text-green-800">Ready to Submit</h3>
                    </div>
                    <p className="mt-2 text-green-700">
                      Your profile is complete! Click submit to send your application for review.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">ID Number</p>
                        <p className="font-medium">{formData.idNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Police Clearance</p>
                        <p className="font-medium">{formData.policeClearanceNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Qualifications</p>
                        <p className="font-medium">{formData.qualifications.filter(q => q.institution).length} added</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Documents</p>
                        <p className="font-medium">
                          {Object.values(files).filter(f => f).length} uploaded
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Step>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  Back
                </Button>
                {currentStep < totalSteps ? (
                  <Button onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Submitting...' : 'Submit Application'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
