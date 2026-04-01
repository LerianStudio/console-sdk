import { renderHook, act } from '@testing-library/react'
import { toast as sonnerToast } from 'sonner'
import { useToast, toast } from './use-toast'

jest.mock('sonner', () => {
  let idCounter = 0
  const dismiss = jest.fn()

  const mockToast: jest.Mock & {
    success: jest.Mock
    error: jest.Mock
    dismiss: jest.Mock
  } = Object.assign(
    jest.fn(() => ++idCounter),
    {
      success: jest.fn(() => ++idCounter),
      error: jest.fn(() => ++idCounter),
      dismiss
    }
  )

  return { toast: mockToast }
})

describe('useToast', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return toast and dismiss functions', () => {
    const { result } = renderHook(() => useToast())

    expect(result.current.toast).toBe(toast)
    expect(typeof result.current.dismiss).toBe('function')
    expect(result.current.toasts).toEqual([])
  })

  it('should call sonner toast for default variant', () => {
    const result = toast({
      title: 'Test Toast',
      description: 'This is a test'
    })

    expect(sonnerToast).toHaveBeenCalledWith('Test Toast', {
      description: 'This is a test',
      duration: 10000
    })
    expect(result.id).toBeDefined()
    expect(typeof result.dismiss).toBe('function')
    expect(typeof result.update).toBe('function')
  })

  it('should call sonner toast.success for success variant', () => {
    toast({
      title: 'Success!',
      description: 'Operation completed',
      variant: 'success'
    })

    expect(sonnerToast.success).toHaveBeenCalledWith('Success!', {
      description: 'Operation completed',
      duration: 10000
    })
  })

  it('should call sonner toast.error with Infinity duration for destructive variant', () => {
    toast({
      title: 'Error',
      description: 'Something went wrong',
      variant: 'destructive'
    })

    expect(sonnerToast.error).toHaveBeenCalledWith('Error', {
      description: 'Something went wrong',
      duration: Infinity
    })
  })

  it('should handle toast with no title (description only)', () => {
    toast({ description: 'Copied to clipboard' })

    expect(sonnerToast).toHaveBeenCalledWith('', {
      description: 'Copied to clipboard',
      duration: 10000
    })
  })

  it('should dismiss a specific toast by id', () => {
    const result = toast({ title: 'Dismiss me' })

    result.dismiss()

    expect(sonnerToast.dismiss).toHaveBeenCalled()
  })

  it('should dismiss all toasts when no id is provided', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.dismiss()
    })

    expect(sonnerToast.dismiss).toHaveBeenCalledWith()
  })

  it('should dismiss a specific toast via useToast.dismiss', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.dismiss('some-id')
    })

    expect(sonnerToast.dismiss).toHaveBeenCalledWith('some-id')
  })
})
