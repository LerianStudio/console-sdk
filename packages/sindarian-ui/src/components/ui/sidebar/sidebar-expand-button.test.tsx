import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { SidebarExpandButton } from './sidebar-expand-button'
import { SidebarProvider } from './sidebar-provider'

/**
 * The expanded branch rendered an icon-only IconButton with no accessible name
 * at all, the `tooltip` prop was read only by the collapsed branch, and neither
 * branch reported `aria-expanded` — so a screen reader could not tell what the
 * control did nor which state the sidebar was in. That gap forced a downstream
 * fork of the whole component.
 */
const renderButton = (props: { tooltip?: string } = {}) =>
  render(
    <SidebarProvider>
      <SidebarExpandButton {...props} />
    </SidebarProvider>
  )

describe('SidebarExpandButton', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('expanded sidebar', () => {
    it('exposes a default accessible name for the collapse action', () => {
      renderButton()

      expect(
        screen.getByRole('button', { name: 'Collapse sidebar' })
      ).toBeInTheDocument()
    })

    it('reports the sidebar as expanded', () => {
      renderButton()

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-expanded',
        'true'
      )
    })

    it('lets the tooltip prop override the accessible name', () => {
      renderButton({ tooltip: 'Recolher menu' })

      expect(
        screen.getByRole('button', { name: 'Recolher menu' })
      ).toBeInTheDocument()
    })
  })

  describe('collapsed sidebar', () => {
    it('exposes a default accessible name for the expand action', async () => {
      localStorage.setItem('sidebar-collapsed', 'true')
      renderButton()

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Expand sidebar' })
        ).toBeInTheDocument()
      })
    })

    it('reports the sidebar as collapsed', async () => {
      localStorage.setItem('sidebar-collapsed', 'true')
      renderButton()

      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveAttribute(
          'aria-expanded',
          'false'
        )
      })
    })

    it('lets the tooltip prop override the accessible name', async () => {
      localStorage.setItem('sidebar-collapsed', 'true')
      renderButton({ tooltip: 'Expandir menu' })

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Expandir menu' })
        ).toBeInTheDocument()
      })
    })
  })

  it('keeps an accessible name and a truthful state across a toggle', () => {
    renderButton()

    const collapse = screen.getByRole('button', { name: 'Collapse sidebar' })
    expect(collapse).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(collapse)

    const expand = screen.getByRole('button', { name: 'Expand sidebar' })
    expect(expand).toHaveAttribute('aria-expanded', 'false')
  })
})
