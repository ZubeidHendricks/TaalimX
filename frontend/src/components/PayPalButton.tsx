'use client'

import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { useToast } from '@/components/ui/use-toast'
import axios from 'axios'

interface PayPalButtonProps {
  classId: number
  amount: number
  onSuccess: (orderID: string) => void
  onError: (error: any) => void
  disabled?: boolean
}

export default function PayPalButton({ classId, amount, onSuccess, onError, disabled }: PayPalButtonProps) {
  const { toast } = useToast()

  const createOrder = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/create-order`,
        { classId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return response.data.orderID
    } catch (error) {
      console.error('Error creating PayPal order:', error)
      throw error
    }
  }

  const onApprove = async (data: any) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/capture-order`,
        { 
          orderID: data.orderID,
          classId 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        onSuccess(data.orderID)
        toast({
          title: 'Payment Successful!',
          description: 'Your class has been booked and confirmed.',
        })
      } else {
        throw new Error('Payment capture failed')
      }
    } catch (error) {
      onError(error)
      toast({
        title: 'Payment Error',
        description: 'There was an error processing your payment.',
        variant: 'destructive'
      })
    }
  }

  const onCancel = () => {
    toast({
      title: 'Payment Cancelled',
      description: 'Your payment was cancelled. No charges were made.',
      variant: 'destructive'
    })
  }

  const onErr = (error: any) => {
    console.error('PayPal error:', error)
    onError(error)
    toast({
      title: 'Payment Error',
      description: 'An error occurred with PayPal. Please try again.',
      variant: 'destructive'
    })
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        currency: 'ZAR',
        intent: 'capture'
      }}
    >
      <PayPalButtons
        disabled={disabled}
        style={{
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: 45
        }}
        createOrder={createOrder}
        onApprove={onApprove}
        onCancel={onCancel}
        onError={onErr}
      />
    </PayPalScriptProvider>
  )
}