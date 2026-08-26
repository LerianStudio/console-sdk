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
const readText = jest.fn().mockResolvedValue('')

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
  readText.mockClear()
  readText.mockResolvedValue('')
  setClipboard({ writeText, readText })
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

  it.each([[true], [false]])(
    'keeps the value out of autofill and spellcheck (masked=%s)',
    (masked) => {
      // The field carries secrets - TOTP manual-entry secrets, recovery codes.
      // While masked it is a type="password" input, which invites browsers and
      // password managers to autofill it or offer to SAVE it, and spellcheck
      // can ship the text to a remote service.
      render(<CopyField value="SECRET123" label="Secret" masked={masked} />)
      const input = screen.getByLabelText('Secret')

      expect(input).toHaveAttribute('autocomplete', 'off')
      expect(input).toHaveAttribute('spellcheck', 'false')
    }
  )

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

      fireEvent.click(toggle)
      expect(input).toHaveAttribute('type', 'text')
      const hideToggle = screen.getByRole('button', { name: /hide value/i })
      expect(hideToggle).toHaveAttribute('aria-pressed', 'true')

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

  describe('clearClipboardAfter', () => {
    const CLEAR_AFTER = 30_000

    beforeEach(() => {
      jest.useFakeTimers()
    })
    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    /** Runs the pending clear timer and drains its await chain. */
    const runClearTimer = async () => {
      await act(async () => {
        jest.advanceTimersByTime(CLEAR_AFTER)
      })
      // readText -> comparison -> writeText: two extra microtask turns.
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })
    }

    const copy = async (name: RegExp) => {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name }))
      })
    }

    it('wipes the clipboard after the delay when it still holds the copied value', async () => {
      readText.mockResolvedValue('SECRET123')

      render(
        <CopyField
          value="SECRET123"
          label="Secret"
          clearClipboardAfter={CLEAR_AFTER}
        />
      )
      await copy(/copy secret/i)
      expect(writeText).toHaveBeenCalledWith('SECRET123')
      // Nothing cleared before the delay elapses.
      expect(writeText).toHaveBeenCalledTimes(1)

      await runClearTimer()
      expect(readText).toHaveBeenCalled()
      expect(writeText).toHaveBeenLastCalledWith('')
    })

    it('leaves the clipboard untouched when it now holds an unrelated value', async () => {
      readText.mockResolvedValue('something the user copied afterwards')

      render(
        <CopyField
          value="SECRET123"
          label="Secret"
          clearClipboardAfter={CLEAR_AFTER}
        />
      )
      await copy(/copy secret/i)
      await runClearTimer()

      expect(readText).toHaveBeenCalled()
      expect(writeText).toHaveBeenCalledTimes(1)
      expect(writeText).toHaveBeenLastCalledWith('SECRET123')
    })

    it('clears against the value copied at click time, not a later prop value', async () => {
      readText.mockResolvedValue('FIRST')

      const { rerender } = render(
        <CopyField
          value="FIRST"
          label="Secret"
          clearClipboardAfter={CLEAR_AFTER}
        />
      )
      await copy(/copy secret/i)
      rerender(
        <CopyField
          value="SECOND"
          label="Secret"
          clearClipboardAfter={CLEAR_AFTER}
        />
      )
      await runClearTimer()

      expect(writeText).toHaveBeenLastCalledWith('')
    })

    it('does not clear when the clipboard cannot be read back', async () => {
      setClipboard({ writeText })

      render(
        <CopyField
          value="SECRET123"
          label="Secret"
          clearClipboardAfter={CLEAR_AFTER}
        />
      )
      await copy(/copy secret/i)
      await runClearTimer()

      expect(writeText).toHaveBeenCalledTimes(1)
      expect(writeText).toHaveBeenLastCalledWith('SECRET123')
    })

    it('does not clear when readText rejects', async () => {
      readText.mockRejectedValue(new Error('permission denied'))

      render(
        <CopyField
          value="SECRET123"
          label="Secret"
          clearClipboardAfter={CLEAR_AFTER}
        />
      )
      await copy(/copy secret/i)
      await runClearTimer()

      expect(writeText).toHaveBeenCalledTimes(1)
    })

    it('does not schedule a clear when the copy itself failed', async () => {
      writeText.mockRejectedValue(new Error('permission denied'))

      render(
        <CopyField
          value="SECRET123"
          label="Secret"
          clearClipboardAfter={CLEAR_AFTER}
        />
      )
      await copy(/copy secret/i)
      await runClearTimer()

      expect(readText).not.toHaveBeenCalled()
    })

    it('never clears when the prop is omitted or non-positive', async () => {
      const { unmount } = render(<CopyField value="SECRET123" label="Secret" />)
      await copy(/copy secret/i)
      await runClearTimer()
      expect(readText).not.toHaveBeenCalled()
      unmount()

      render(
        <CopyField value="SECRET123" label="Secret" clearClipboardAfter={0} />
      )
      await copy(/copy secret/i)
      await runClearTimer()
      expect(readText).not.toHaveBeenCalled()
    })

    it('still clears after the field unmounts before the delay elapses', async () => {
      readText.mockResolvedValue('SECRET123')

      const { unmount } = render(
        <CopyField
          value="SECRET123"
          label="Secret"
          clearClipboardAfter={CLEAR_AFTER}
        />
      )
      await copy(/copy secret/i)
      unmount()
      await runClearTimer()

      expect(writeText).toHaveBeenLastCalledWith('')
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
