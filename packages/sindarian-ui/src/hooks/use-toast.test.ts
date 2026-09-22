import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { toast as sonnerToast } from 'sonner'
import { useToast, toast } from './use-toast'

jest.mock('sonner', () => {
  let idCounter = 0
  const dismiss = jest.fn()

  const mockToast: jest.Mock & {
    success: jest.Mock
    warning: jest.Mock
    error: jest.Mock
    dismiss: jest.Mock
  } = Object.assign(
    jest.fn(() => ++idCounter),
    {
      success: jest.fn(() => ++idCounter),
      warning: jest.fn(() => ++idCounter),
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

  it('should call sonner toast.warning for warning variant', () => {
    toast({
      title: 'Heads up',
      description: 'Partially applied',
      variant: 'warning'
    })

    expect(sonnerToast.warning).toHaveBeenCalledWith('Heads up', {
      description: 'Partially applied',
      duration: 10000
    })
    expect(sonnerToast.error).not.toHaveBeenCalled()
  })

  it('should call sonner toast.error with no auto-dismiss for destructive variant', () => {
    toast({
      title: 'Error',
      description: 'Something went wrong',
      variant: 'destructive'
    })

    expect(sonnerToast.error).toHaveBeenCalledWith('Error', {
      description: 'Something went wrong',
      duration: Infinity,
      id: 'destructive:Error:Something went wrong'
    })
  })

  it('should honour a caller-supplied duration on the destructive variant', () => {
    toast({
      title: 'Error',
      description: 'Something went wrong',
      variant: 'destructive',
      duration: 3000
    })

    expect(sonnerToast.error).toHaveBeenCalledWith('Error', {
      description: 'Something went wrong',
      duration: 3000,
      id: 'destructive:Error:Something went wrong'
    })
  })

  it('should honour a caller-supplied duration on the default variant', () => {
    toast({ title: 'Quick', duration: 1500 })

    expect(sonnerToast).toHaveBeenCalledWith('Quick', {
      description: undefined,
      duration: 1500
    })
  })

  it('should keep the destructive lifetime when the toast is updated', () => {
    const result = toast({ title: 'Error', variant: 'destructive' })

    result.update({ description: 'Still failing' })

    expect(sonnerToast).toHaveBeenCalledWith(
      'Error',
      expect.objectContaining({ duration: Infinity })
    )
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

describe('repeated destructive toasts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const errorOptions = (call: number) =>
    (sonnerToast.error as jest.Mock).mock.calls[call][1]

  it('should collapse an identical error onto the same id', () => {
    toast({ title: 'Error', description: 'Refused', variant: 'destructive' })
    toast({ title: 'Error', description: 'Refused', variant: 'destructive' })

    expect(sonnerToast.error).toHaveBeenCalledTimes(2)
    expect(errorOptions(0).id).toBe('destructive:Error:Refused')
    expect(errorOptions(1).id).toBe(errorOptions(0).id)
  })

  it('should give errors with different descriptions different ids', () => {
    toast({ title: 'Error', description: 'Refused', variant: 'destructive' })
    toast({ title: 'Error', description: 'Timed out', variant: 'destructive' })

    expect(errorOptions(0).id).not.toBe(errorOptions(1).id)
  })

  it('should let a caller-supplied id win over the derived one', () => {
    toast({
      title: 'Error',
      description: 'Refused',
      variant: 'destructive',
      id: 'payment-refused'
    })

    expect(errorOptions(0).id).toBe('payment-refused')
  })

  it('should not collapse success toasts', () => {
    toast({ title: 'Saved', description: 'Done', variant: 'success' })
    toast({ title: 'Saved', description: 'Done', variant: 'success' })

    const calls = (sonnerToast.success as jest.Mock).mock.calls
    expect(calls[0][1]).not.toHaveProperty('id')
    expect(calls[1][1]).not.toHaveProperty('id')
  })

  it('should not derive an id from a non-string title', () => {
    toast({
      title: React.createElement('span', null, 'Error'),
      description: 'Refused',
      variant: 'destructive'
    })

    expect(errorOptions(0)).not.toHaveProperty('id')
  })
})

describe('updating a toast lifetime', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should honour a duration passed to update on a destructive toast', () => {
    const result = toast({ title: 'Error', variant: 'destructive' })

    result.update({ duration: 2000 })

    expect(sonnerToast).toHaveBeenCalledWith(
      'Error',
      expect.objectContaining({ duration: 2000 })
    )
  })

  it('should keep the 10s lifetime when a default toast is updated', () => {
    const result = toast({ title: 'Heads up' })

    result.update({ description: 'Still going' })

    expect(sonnerToast).toHaveBeenLastCalledWith(
      'Heads up',
      expect.objectContaining({ duration: 10000 })
    )
  })
})
