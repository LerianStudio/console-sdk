import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CopyField } from '.'

const mockToast = jest.fn()

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}))

const FALLBACK_COPY_LABEL =
  'Copy not available — text selected, press Ctrl/Cmd+C'

const writeText = jest.fn().mockResolvedValue(undefined)

const setClipboard = (value: unknown) => {
  Object.defineProperty(navigator, 'clipboard', {
    value,
    configurable: true,
    writable: true
  })
}

beforeEach(() => {
  mockToast.mockClear()
  writeText.mockClear()
  writeText.mockResolvedValue(undefined)
  setClipboard({ writeText })
})

describe('CopyField', () => {
  it('renders the value in a read-only input', () => {
    render(<CopyField value="SECRET123" label="Secret" />)
    const input = screen.getByLabelText('Secret')
    expect(input).toHaveValue('SECRET123')
    expect(input).toHaveAttribute('readonly')
  })

  it('associates the visible label with the input via htmlFor/id', () => {
    render(<CopyField value="abc" label="API Key" />)
    expect(screen.getByLabelText('API Key')).toBeInTheDocument()
  })

  it('copies the value to the clipboard when the copy button is clicked', async () => {
    render(<CopyField value="SECRET123" label="Secret" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy secret/i }))
    })
    expect(writeText).toHaveBeenCalledWith('SECRET123')
  })

  it('fires a success toast with the provided onCopyLabel after copying', async () => {
    render(
      <CopyField
        value="SECRET123"
        label="Secret"
        onCopyLabel="Secret copied!"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /copy secret/i }))
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success', title: 'Secret copied!' })
      )
    )
  })

  it('uses the default copy label when onCopyLabel is not provided', async () => {
    render(<CopyField value="abc" />)
    fireEvent.click(screen.getByRole('button', { name: /copy/i }))
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Copied to clipboard!' })
      )
    )
  })

  it('gives the copy button an accessible name even without a label', () => {
    render(<CopyField value="abc" />)
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument()
  })

  it('overrides the input aria-label via valueLabel when no visible label', () => {
    render(<CopyField value="abc" valueLabel="Valor para copiar" />)
    expect(screen.getByLabelText('Valor para copiar')).toBeInTheDocument()
  })

  describe('masked', () => {
    it('obscures the displayed value while keeping the real value copyable', async () => {
      render(<CopyField value="TOTPSECRET" label="Secret" masked />)
      const input = screen.getByLabelText('Secret')
      expect(input).toHaveAttribute('type', 'password')
      expect(input).toHaveValue('TOTPSECRET')

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /copy secret/i }))
      })
      expect(writeText).toHaveBeenCalledWith('TOTPSECRET')
    })

    it('reveals and then hides the value with the reveal toggle (aria-pressed)', () => {
      render(<CopyField value="s3cr3t" label="Secret" masked />)
      const input = screen.getByLabelText('Secret')
      expect(input).toHaveAttribute('type', 'password')

      const toggle = screen.getByRole('button', { name: /show value/i })
      expect(toggle).toHaveAttribute('aria-pressed', 'false')

      // Reveal.
      fireEvent.click(toggle)
      expect(input).toHaveAttribute('type', 'text')
      const hideToggle = screen.getByRole('button', { name: /hide value/i })
      expect(hideToggle).toHaveAttribute('aria-pressed', 'true')

      // Hide back.
      fireEvent.click(hideToggle)
      expect(input).toHaveAttribute('type', 'password')
      expect(
        screen.getByRole('button', { name: /show value/i })
      ).toHaveAttribute('aria-pressed', 'false')
    })

    it('supports localized reveal/hide labels', () => {
      render(
        <CopyField
          value="s3cr3t"
          label="Secret"
          masked
          revealLabel="Mostrar valor"
          hideLabel="Ocultar valor"
        />
      )
      const toggle = screen.getByRole('button', { name: 'Mostrar valor' })
      fireEvent.click(toggle)
      expect(
        screen.getByRole('button', { name: 'Ocultar valor' })
      ).toBeInTheDocument()
    })

    it('does not render a reveal toggle when not masked', () => {
      render(<CopyField value="abc" label="Token" />)
      expect(
        screen.queryByRole('button', { name: /show value/i })
      ).not.toBeInTheDocument()
    })
  })

  describe('clipboard unavailable fallback', () => {
    it('selects the input text and toasts the fallback label when clipboard API is absent', async () => {
      setClipboard(undefined)
      const selectSpy = jest.spyOn(HTMLInputElement.prototype, 'select')

      render(<CopyField value="abc" label="Token" />)
      expect(() =>
        fireEvent.click(screen.getByRole('button', { name: /copy token/i }))
      ).not.toThrow()

      expect(selectSpy).toHaveBeenCalled()
      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: FALLBACK_COPY_LABEL })
        )
      )
      selectSpy.mockRestore()
    })

    it('fires the fallback toast and NOT the success toast when writeText rejects', async () => {
      writeText.mockRejectedValueOnce(new Error('permission denied'))
      const selectSpy = jest.spyOn(HTMLInputElement.prototype, 'select')

      render(<CopyField value="abc" label="Token" />)
      fireEvent.click(screen.getByRole('button', { name: /copy token/i }))

      await waitFor(() => expect(selectSpy).toHaveBeenCalled())
      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: FALLBACK_COPY_LABEL })
        )
      )
      expect(mockToast).not.toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' })
      )
      selectSpy.mockRestore()
    })

    it('makes a masked field textual (selectable) before the fallback selection when clipboard is absent', async () => {
      setClipboard(undefined)
      const selectSpy = jest.spyOn(HTMLInputElement.prototype, 'select')

      render(<CopyField value="TOTPSECRET" label="Secret" masked />)
      const input = screen.getByLabelText('Secret') as HTMLInputElement
      expect(input).toHaveAttribute('type', 'password')

      fireEvent.click(screen.getByRole('button', { name: /copy secret/i }))

      // The field must be text (selectable) at/after the fallback, and it must
      // still hold the real secret so Ctrl/Cmd+C copies the true value.
      expect(input).toHaveAttribute('type', 'text')
      expect(input).toHaveValue('TOTPSECRET')
      expect(selectSpy).toHaveBeenCalled()
      selectSpy.mockRestore()
    })

    it('makes a masked field textual before the fallback selection when writeText rejects', async () => {
      writeText.mockRejectedValueOnce(new Error('permission denied'))
      const selectSpy = jest.spyOn(HTMLInputElement.prototype, 'select')

      render(<CopyField value="TOTPSECRET" label="Secret" masked />)
      const input = screen.getByLabelText('Secret') as HTMLInputElement
      expect(input).toHaveAttribute('type', 'password')

      fireEvent.click(screen.getByRole('button', { name: /copy secret/i }))

      await waitFor(() => expect(selectSpy).toHaveBeenCalled())
      expect(input).toHaveAttribute('type', 'text')
      expect(input).toHaveValue('TOTPSECRET')
      selectSpy.mockRestore()
    })
  })

  describe('copied-indicator timer', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })
    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('does not throw on rapid double-copy or unmount before the timeout', async () => {
      const { unmount } = render(<CopyField value="abc" label="Token" />)
      const button = screen.getByRole('button', { name: /copy token/i })

      await act(async () => {
        fireEvent.click(button)
      })
      await act(async () => {
        fireEvent.click(button)
      })

      // Unmount before the copied-icon timeout fires; the cleanup effect must
      // clear the pending timer so no setState-after-unmount occurs.
      expect(() => {
        unmount()
        jest.advanceTimersByTime(2000)
      }).not.toThrow()
    })
  })
})
