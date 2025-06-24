'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft } from 'lucide-react'

export default function PaymentCancelled() {
  const router = useRouter()

  useEffect(() => {
    // Clean up any pending payment data
    localStorage.removeItem('pendingClassId')
  }, [])

  const handleRetry = () => {
    router.push('/parent/teachers')
  }

  const handleDashboard = () => {
    router.push('/parent/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <XCircle className="h-6 w-6 text-yellow-500" />
              Payment Cancelled
            </CardTitle>
            <CardDescription>
              Your payment was cancelled and no charges were made.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">No Payment Processed</h3>
              <p className="text-sm text-yellow-700">
                You cancelled the payment process. Your class was not booked and no charges were made to your PayPal account.
              </p>
            </div>

            <div className="space-y-2">
              <Button onClick={handleRetry} className="w-full">
                Book Another Class
              </Button>
              <Button onClick={handleDashboard} variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}