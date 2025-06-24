import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import PayPalButton from '@/components/PayPalButton'
import axios from 'axios'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// Mock PayPal React SDK
jest.mock('@paypal/react-paypal-js', () => ({
  PayPalScriptProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="paypal-provider">{children}</div>,
  PayPalButtons: ({ createOrder, onApprove, onCancel, onError, disabled }: any) => (
    <div data-testid="paypal-buttons">
      <button 
        disabled={disabled}
        onClick={() => {
          if (createOrder) {
            createOrder().then((orderID: string) => {
              if (onApprove) {
                onApprove({ orderID })
              }
            }).catch((error: any) => {
              if (onError) {
                onError(error)
              }
            })
          }
        }}
      >
        Pay with PayPal
      </button>
      <button onClick={() => onCancel && onCancel()}>
        Cancel
      </button>
    </div>
  )
}))

// Mock toast
const mockToast = jest.fn()
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('PayPalButton', () => {
  const mockProps = {
    classId: 1,
    amount: 150,
    onSuccess: jest.fn(),
    onError: jest.fn(),
    disabled: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('mock-token')
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID = 'test-client-id'
  })

  it('renders PayPal button correctly', () => {
    render(<PayPalButton {...mockProps} />)
    
    expect(screen.getByTestId('paypal-provider')).toBeInTheDocument()
    expect(screen.getByTestId('paypal-buttons')).toBeInTheDocument()
    expect(screen.getByText('Pay with PayPal')).toBeInTheDocument()
  })

  it('creates PayPal order when button is clicked', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { orderID: 'PAYPAL_ORDER_123' }
    })

    render(<PayPalButton {...mockProps} />)
    
    fireEvent.click(screen.getByText('Pay with PayPal'))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/payments/create-order',
        { classId: 1 },
        { headers: { Authorization: 'Bearer mock-token' } }
      )
    })
  })

  it('handles successful payment flow', async () => {
    mockedAxios.post
      .mockResolvedValueOnce({ data: { orderID: 'PAYPAL_ORDER_123' } }) // Create order
      .mockResolvedValueOnce({ data: { success: true } }) // Capture order

    render(<PayPalButton {...mockProps} />)
    
    fireEvent.click(screen.getByText('Pay with PayPal'))

    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalledWith('PAYPAL_ORDER_123')
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Payment Successful!',
        description: 'Your class has been booked and confirmed.',
      })
    })
  })

  it('handles payment capture failure', async () => {
    mockedAxios.post
      .mockResolvedValueOnce({ data: { orderID: 'PAYPAL_ORDER_123' } })
      .mockResolvedValueOnce({ data: { success: false } })

    render(<PayPalButton {...mockProps} />)
    
    fireEvent.click(screen.getByText('Pay with PayPal'))

    await waitFor(() => {
      expect(mockProps.onError).toHaveBeenCalled()
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Payment Error',
        description: 'There was an error processing your payment.',
        variant: 'destructive'
      })
    })
  })

  it('handles order creation error', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network error'))

    render(<PayPalButton {...mockProps} />)
    
    fireEvent.click(screen.getByText('Pay with PayPal'))

    await waitFor(() => {
      expect(mockProps.onError).toHaveBeenCalled()
    })
  })

  it('handles payment cancellation', () => {
    render(<PayPalButton {...mockProps} />)
    
    fireEvent.click(screen.getByText('Cancel'))

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Payment Cancelled',
      description: 'Your payment was cancelled. No charges were made.',
      variant: 'destructive'
    })
  })

  it('disables button when disabled prop is true', () => {
    render(<PayPalButton {...mockProps} disabled={true} />)
    
    expect(screen.getByText('Pay with PayPal')).toBeDisabled()
  })

  it('uses correct PayPal configuration', () => {
    render(<PayPalButton {...mockProps} />)
    
    // Verify PayPal provider is rendered with correct props
    expect(screen.getByTestId('paypal-provider')).toBeInTheDocument()
  })

  it('handles missing authentication token', async () => {
    mockLocalStorage.getItem.mockReturnValue(null)

    render(<PayPalButton {...mockProps} />)
    
    fireEvent.click(screen.getByText('Pay with PayPal'))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/payments/create-order',
        { classId: 1 },
        { headers: { Authorization: 'Bearer null' } }
      )
    })
  })

  it('calls capture order with correct parameters', async () => {
    mockedAxios.post
      .mockResolvedValueOnce({ data: { orderID: 'PAYPAL_ORDER_123' } })
      .mockResolvedValueOnce({ data: { success: true } })

    render(<PayPalButton {...mockProps} />)
    
    fireEvent.click(screen.getByText('Pay with PayPal'))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenNthCalledWith(2,
        'http://localhost:3000/api/payments/capture-order',
        { 
          orderID: 'PAYPAL_ORDER_123',
          classId: 1 
        },
        { headers: { Authorization: 'Bearer mock-token' } }
      )
    })
  })
})