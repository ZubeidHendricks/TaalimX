'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import axios from 'axios'

export default function PaymentSuccess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [isProcessing, setIsProcessing] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'failed'>('processing')
  const [orderDetails, setOrderDetails] = useState<any>(null)

  useEffect(() => {
    const processPayment = async () => {
      try {
        const token = searchParams.get('token') // PayPal order ID
        const payerID = searchParams.get('PayerID')
        const classId = localStorage.getItem('pendingClassId')

        if (!token || !payerID || !classId) {
          setPaymentStatus('failed')
          setIsProcessing(false)
          return
        }

        const authToken = localStorage.getItem('token')
        if (!authToken) {
          router.push('/sign-in')
          return
        }

        // Capture the PayPal payment
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/payments/capture-payment`,
          {
            orderId: token
          },
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        )

        if (response.data.success) {
          setPaymentStatus('success')
          setOrderDetails(response.data)
          
          // Clear pending class ID
          localStorage.removeItem('pendingClassId')
          
          toast({
            title: 'Payment Successful!',
            description: 'Your class has been booked and confirmed.',
          })
        } else {
          setPaymentStatus('failed')
        }
      } catch (error) {
        console.error('Payment processing error:', error)
        setPaymentStatus('failed')
        toast({
          title: 'Payment Error',
          description: 'There was an error processing your payment.',
          variant: 'destructive'
        })
      } finally {
        setIsProcessing(false)
      }
    }

    processPayment()
  }, [searchParams, router, toast])

  const handleContinue = () => {
    router.push('/parent/classes')
  }

  const handleRetry = () => {
    const classId = localStorage.getItem('pendingClassId')
    if (classId) {
      router.push(`/parent/book-class?retry=${classId}`)
    } else {
      router.push('/parent/teachers')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {paymentStatus === 'processing' && (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Processing Payment
                </>
              )}
              {paymentStatus === 'success' && (
                <>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  Payment Successful
                </>
              )}
              {paymentStatus === 'failed' && (
                <>
                  <XCircle className="h-6 w-6 text-red-500" />
                  Payment Failed
                </>
              )}
            </CardTitle>
            <CardDescription>
              {paymentStatus === 'processing' && 'Please wait while we process your payment...'}
              {paymentStatus === 'success' && 'Your class booking has been confirmed!'}
              {paymentStatus === 'failed' && 'There was an issue with your payment.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentStatus === 'success' && orderDetails && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Booking Confirmed</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Order ID:</strong> {orderDetails.orderID}</p>
                  <p><strong>Capture ID:</strong> {orderDetails.captureID}</p>
                  <p className="mt-2">You will receive a confirmation email shortly.</p>
                </div>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">Payment Failed</h3>
                <p className="text-sm text-red-700">
                  Your payment could not be processed. Please try again or contact support if the issue persists.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {paymentStatus === 'success' && (
                <Button onClick={handleContinue} className="w-full">
                  View My Classes
                </Button>
              )}
              
              {paymentStatus === 'failed' && (
                <>
                  <Button onClick={handleRetry} variant="outline" className="flex-1">
                    Try Again
                  </Button>
                  <Button onClick={() => router.push('/parent/dashboard')} className="flex-1">
                    Go to Dashboard
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}