/**
 * Masking correctness for KeyId — a leaked PII key is a privacy incident, so the
 * mask shape is pinned and, critically, the masked output must never echo the
 * raw secret. Ported from sindarian-x@0.15.0's
 * `src/components/ledger/key-id.test.ts`, plus the copy path (which must always
 * lift the RAW value) exercised against the rendered component.
 */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { KeyId, maskKeyId, masksByDefault } from '.'

// The redaction bullet, mirrored locally so the test stays self-contained.
const DOT_BULLET = '•'

// Fake-but-well-formed fixtures.
const CPF = '529.982.247-25'
const CNPJ = '11.222.333/0001-81'
const EMAIL = 'fred@lerian.studio'
const PHONE = '+55 (11) 91234-5678'
const EVP = '123e4567-e89b-12d3-a456-426614174000'
const E2E = 'E3207415820240621120049a1b2c3d4'

describe('maskKeyId', () => {
  // --- pix-cpf: reveal the central blocks, dot head + check digits -----------
  it('reveals the middle of a CPF and dots head + check', () => {
    expect(maskKeyId(CPF, 'pix-cpf')).toBe('•••.982.247-••')
  })
  it('accepts a bare 11-digit CPF run', () => {
    expect(maskKeyId('52998224725', 'pix-cpf')).toBe('•••.982.247-••')
  })

  // --- pix-cnpj: reveal central registration blocks, dot head + check --------
  it('reveals the central blocks of a CNPJ and dots head + check', () => {
    expect(maskKeyId(CNPJ, 'pix-cnpj')).toBe('••.222.333/0001-••')
  })

  // --- pix-email: first char + dots + full domain ---------------------------
  it('keeps the first char and the domain of an email', () => {
    expect(maskKeyId(EMAIL, 'pix-email')).toBe('f•••@lerian.studio')
  })

  // --- pix-phone: keep country/area, reveal last 2 --------------------------
  it('keeps +55 / area and reveals the last two phone digits', () => {
    expect(maskKeyId(PHONE, 'pix-phone')).toBe('+55 (11) •••••-••78')
  })

  // --- id-shaped kinds: middle-truncate, never structured -------------------
  it('truncates the middle for evp/e2e/idempotency/generic', () => {
    expect(maskKeyId(E2E, 'e2e')).toBe('E32074…c3d4')
    expect(maskKeyId(EVP, 'pix-evp')).toBe('123e45…4000')
    expect(maskKeyId(E2E, 'idempotency')).toBe('E32074…c3d4')
    expect(maskKeyId(E2E, 'generic')).toBe('E32074…c3d4')
  })
  it('leaves a short id untouched (nothing to hide)', () => {
    expect(maskKeyId('abc123', 'generic')).toBe('abc123')
  })

  // --- malformed-for-kind REDACTS, never falls through to the raw value -----
  // CodeRabbit #4 — DELIBERATE DIVERGENCE from sindarian-x@0.15.0, which fell
  // back to `truncateMiddle`. Truncation returns any value of 11 characters or
  // fewer WHOLE, so a malformed-but-real document (a CPF missing a digit, a
  // short phone) rendered in full from the "masked" path — the exact leak the
  // mask exists to prevent. Malformed PII is now redacted outright.
  const REDACTED = '••••••'

  it('redacts a malformed CPF rather than truncating it', () => {
    expect(maskKeyId('not-a-cpf-at-all', 'pix-cpf')).toBe(REDACTED)
  })
  it('redacts a wrong-length CNPJ', () => {
    expect(maskKeyId('123', 'pix-cnpj')).toBe(REDACTED)
  })
  it('redacts an email with no domain', () => {
    expect(maskKeyId('no-at-sign-here', 'pix-email')).toBe(REDACTED)
  })
  it.each([
    ['a@private@domain.test'],
    ['first.last@corp@example.com'],
    ['x@@y.test'],
    ['a@b@c@d.test']
  ])('redacts an email with more than one @ (%s)', (value) => {
    // Splitting on the FIRST '@' published the rest verbatim as the "domain",
    // so the local part of the second address leaked out of the masked view.
    const masked = maskKeyId(value, 'pix-email')
    expect(masked).toBe(REDACTED)
    expect(masked).not.toContain('private')
    expect(masked).not.toContain('@')
  })
  it('redacts a non-BR / wrong-length phone', () => {
    expect(maskKeyId('+1 415 555 0100', 'pix-phone')).toBe(REDACTED)
  })

  // The regression that motivated the change: a SHORT malformed PII value was
  // returned verbatim, because truncateMiddle leaves anything <= 11 chars whole.
  it('never returns a short malformed PII value verbatim', () => {
    for (const [value, kind] of [
      ['5299822472', 'pix-cpf'], // CPF one digit short
      ['1122233300', 'pix-cnpj'], // CNPJ four digits short
      ['fred', 'pix-email'], // no @ at all
      ['11912345', 'pix-phone'] // local-format phone
    ] as const) {
      const out = maskKeyId(value, kind)
      expect(out).not.toBe(value)
      expect(out).not.toContain(value)
      expect(out).toBe(REDACTED)
    }
  })

  // Redaction must not leak the length either — every malformed PII value of
  // every kind produces the same fixed-width run.
  it('redacts to a fixed width, leaking no length information', () => {
    const short = maskKeyId('1', 'pix-cpf')
    const long = maskKeyId('1'.repeat(200), 'pix-cpf')
    expect(short).toBe(long)
  })

  // Id-shaped kinds are long but NOT secret: they keep truncation, unchanged.
  it('leaves the id-shaped kinds on truncation, not redaction', () => {
    expect(maskKeyId(E2E, 'e2e')).toBe('E32074…c3d4')
    expect(maskKeyId('abc123', 'generic')).toBe('abc123')
  })

  // --- the load-bearing invariant: a PII mask never echoes the raw secret ----
  it('never returns the raw value for a well-formed PII key', () => {
    for (const [value, kind] of [
      [CPF, 'pix-cpf'],
      [CNPJ, 'pix-cnpj'],
      [EMAIL, 'pix-email'],
      [PHONE, 'pix-phone']
    ] as const) {
      const out = maskKeyId(value, kind)
      expect(out).not.toBe(value)
      expect(out).toContain(DOT_BULLET)
    }
  })
  it('hides the CPF check digits (the spoofable tail)', () => {
    // Structural, not "does the string contain 25". That substring check passes
    // for THIS fixture only: another CPF's revealed middle blocks could legally
    // contain those two characters and fail a perfectly correct mask. What
    // matters is that the block after the final separator — the check digits —
    // is dots, and as many dots as there were digits.
    const masked = maskKeyId(CPF, 'pix-cpf')
    const checkDigits = CPF.slice(CPF.lastIndexOf('-') + 1)
    const maskedTail = masked.slice(masked.lastIndexOf('-') + 1)

    expect(maskedTail).toBe(DOT_BULLET.repeat(checkDigits.length))
    expect(maskedTail).not.toBe(checkDigits)
  })
})

describe('masksByDefault', () => {
  it('is true for PII kinds, false for id-shaped kinds', () => {
    expect(masksByDefault('pix-cpf')).toBe(true)
    expect(masksByDefault('pix-cnpj')).toBe(true)
    expect(masksByDefault('pix-email')).toBe(true)
    expect(masksByDefault('pix-phone')).toBe(true)
    expect(masksByDefault('pix-evp')).toBe(false)
    expect(masksByDefault('e2e')).toBe(false)
    expect(masksByDefault('idempotency')).toBe(false)
    expect(masksByDefault('generic')).toBe(false)
  })
})

describe('KeyId', () => {
  it('masks a PII kind by default', () => {
    const { container } = render(<KeyId value={CPF} kind="pix-cpf" />)
    expect(container.textContent).toContain('•••.982.247-••')
    expect(container.textContent).not.toContain(CPF)
  })

  it('un-redacts a PII kind when mask={false}, still middle-truncating it', () => {
    // Unmasked is not "raw on screen": a long value is still truncated in the
    // middle so a row cannot blow out. The raw value moves to the title.
    const { container } = render(
      <KeyId value={CPF} kind="pix-cpf" mask={false} />
    )
    expect(container.textContent).toBe('529.98…7-25')
    expect(container.textContent).not.toContain('•')
    expect(screen.getByTitle(CPF)).toBeInTheDocument()
  })

  it('never leaks a masked value through the title attribute', () => {
    const { container } = render(<KeyId value={CPF} kind="pix-cpf" />)
    const value = container.querySelector('span[title]')
    expect(value).toBeNull()
  })

  it('exposes the raw value as a title only when nothing is hidden', () => {
    render(<KeyId value="abc123" kind="generic" />)
    expect(screen.getByTitle('abc123')).toBeInTheDocument()
  })

  it('renders the optional label', () => {
    render(<KeyId value={CPF} kind="pix-cpf" label="Pagador" />)
    expect(screen.getByText('Pagador')).toBeInTheDocument()
  })

  it('copies the RAW, unmasked value even when the display is masked', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true
    })

    render(<KeyId value={CPF} kind="pix-cpf" copyable />)
    fireEvent.click(screen.getByRole('button', { name: 'Copiar valor' }))

    expect(writeText).toHaveBeenCalledWith(CPF)
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: 'Copiado para a área de transferência'
        })
      ).toBeInTheDocument()
    )
  })

  // CodeRabbit #8: writeText rejects on a denied permission or a non-secure
  // context. Unhandled, that is a console error in the render tree; worse, a
  // confirmation would be a lie about what reached the clipboard.
  it('survives a rejected clipboard write without confirming the copy', async () => {
    const writeText = jest.fn().mockRejectedValue(new Error('denied'))
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true
    })

    render(<KeyId value={CPF} kind="pix-cpf" copyable />)
    const button = screen.getByRole('button', { name: 'Copiar valor' })
    expect(() => fireEvent.click(button)).not.toThrow()

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(CPF))
    // The button must NOT flip to the copied state — nothing was copied.
    expect(
      screen.getByRole('button', { name: 'Copiar valor' })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', {
        name: 'Copiado para a área de transferência'
      })
    ).toBeNull()
  })

  it('does not throw when the clipboard API is unavailable', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
      writable: true
    })
    render(<KeyId value={CPF} kind="pix-cpf" copyable />)
    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: 'Copiar valor' }))
    ).not.toThrow()
  })

  it('renders no copy affordance unless copyable is set', () => {
    render(<KeyId value={CPF} kind="pix-cpf" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
