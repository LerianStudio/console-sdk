import { renderHook, act, waitFor } from '@testing-library/react'
import React from 'react'
import { SidebarProvider, useSidebar } from './sidebar-provider'

const wrapper = ({ children }: React.PropsWithChildren) => (
  <SidebarProvider>{children}</SidebarProvider>
)

describe('SidebarProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with collapsed as false (SSR-safe default)', () => {
      const { result } = renderHook(() => useSidebar(), { wrapper })
      expect(result.current.isCollapsed).toBe(false)
    })

    it('should initialize with empty items (SSR-safe default)', () => {
      const { result } = renderHook(() => useSidebar(), { wrapper })
      expect(result.current.items).toEqual({})
    })
  })

  describe('hydration from localStorage', () => {
    it('should load collapsed state from localStorage after hydration', async () => {
      localStorage.setItem('sidebar-collapsed', 'true')

      const { result } = renderHook(() => useSidebar(), { wrapper })

      await waitFor(() => {
        expect(result.current.isCollapsed).toBe(true)
      })
    })

    it('should load items from localStorage after hydration', async () => {
      const storedItems = { 'item-1': true, 'item-2': false }
      localStorage.setItem('sidebar-items', JSON.stringify(storedItems))

      const { result } = renderHook(() => useSidebar(), { wrapper })

      await waitFor(() => {
        expect(result.current.items).toEqual(storedItems)
      })
    })

    it('should handle invalid JSON in localStorage gracefully', async () => {
      localStorage.setItem('sidebar-items', 'invalid-json')

      const { result } = renderHook(() => useSidebar(), { wrapper })

      await waitFor(() => {
        expect(result.current.items).toEqual({})
      })
    })
  })

  describe('toggleSidebar', () => {
    it('should toggle collapsed state from false to true', async () => {
      const { result } = renderHook(() => useSidebar(), { wrapper })

      expect(result.current.isCollapsed).toBe(false)

      act(() => {
        result.current.toggleSidebar()
      })

      expect(result.current.isCollapsed).toBe(true)
    })

    it('should toggle collapsed state from true to false', async () => {
      localStorage.setItem('sidebar-collapsed', 'true')

      const { result } = renderHook(() => useSidebar(), { wrapper })

      await waitFor(() => {
        expect(result.current.isCollapsed).toBe(true)
      })

      act(() => {
        result.current.toggleSidebar()
      })

      expect(result.current.isCollapsed).toBe(false)
    })
  })

  describe('getItemCollapsed', () => {
    it('should return false for non-existent item', () => {
      const { result } = renderHook(() => useSidebar(), { wrapper })
      expect(result.current.getItemCollapsed('non-existent')).toBe(false)
    })

    it('should return the correct value for existing item', async () => {
      localStorage.setItem(
        'sidebar-items',
        JSON.stringify({ 'my-item': true })
      )

      const { result } = renderHook(() => useSidebar(), { wrapper })

      await waitFor(() => {
        expect(result.current.getItemCollapsed('my-item')).toBe(true)
      })
    })
  })

  describe('setItemCollapsed', () => {
    it('should set item collapsed state', () => {
      const { result } = renderHook(() => useSidebar(), { wrapper })

      act(() => {
        result.current.setItemCollapsed('new-item', true)
      })

      expect(result.current.items['new-item']).toBe(true)
      expect(result.current.getItemCollapsed('new-item')).toBe(true)
    })

    it('should update existing item collapsed state', async () => {
      localStorage.setItem(
        'sidebar-items',
        JSON.stringify({ 'existing-item': true })
      )

      const { result } = renderHook(() => useSidebar(), { wrapper })

      await waitFor(() => {
        expect(result.current.getItemCollapsed('existing-item')).toBe(true)
      })

      act(() => {
        result.current.setItemCollapsed('existing-item', false)
      })

      expect(result.current.getItemCollapsed('existing-item')).toBe(false)
    })

    it('should preserve other items when setting a new item', async () => {
      localStorage.setItem(
        'sidebar-items',
        JSON.stringify({ 'item-1': true, 'item-2': false })
      )

      const { result } = renderHook(() => useSidebar(), { wrapper })

      await waitFor(() => {
        expect(result.current.items).toEqual({ 'item-1': true, 'item-2': false })
      })

      act(() => {
        result.current.setItemCollapsed('item-3', true)
      })

      expect(result.current.items).toEqual({
        'item-1': true,
        'item-2': false,
        'item-3': true
      })
    })
  })

  describe('localStorage persistence', () => {
    it('should persist collapsed state to localStorage after change', async () => {
      const { result } = renderHook(() => useSidebar(), { wrapper })

      // Wait for hydration
      await waitFor(() => {
        expect(localStorage.getItem('sidebar-collapsed')).toBeDefined()
      })

      act(() => {
        result.current.toggleSidebar()
      })

      await waitFor(() => {
        expect(localStorage.getItem('sidebar-collapsed')).toBe('true')
      })
    })

    it('should persist items to localStorage after change', async () => {
      const { result } = renderHook(() => useSidebar(), { wrapper })

      // Wait for hydration
      await waitFor(() => {
        expect(localStorage.getItem('sidebar-items')).toBeDefined()
      })

      act(() => {
        result.current.setItemCollapsed('persisted-item', true)
      })

      await waitFor(() => {
        const stored = JSON.parse(localStorage.getItem('sidebar-items') || '{}')
        expect(stored['persisted-item']).toBe(true)
      })
    })

    it('should not overwrite localStorage before hydration completes', async () => {
      const initialItems = { 'pre-existing': true }
      localStorage.setItem('sidebar-items', JSON.stringify(initialItems))

      renderHook(() => useSidebar(), { wrapper })

      // The initial localStorage value should be preserved and loaded
      await waitFor(() => {
        const stored = JSON.parse(localStorage.getItem('sidebar-items') || '{}')
        expect(stored['pre-existing']).toBe(true)
      })
    })
  })

  describe('useSidebar hook', () => {
    it('should throw error when used outside SidebarProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      expect(() => {
        renderHook(() => useSidebar())
      }).toThrow('useSidebar must be used within a SidebarProvider')

      consoleSpy.mockRestore()
    })
  })
})
