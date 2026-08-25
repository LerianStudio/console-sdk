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

  // --- malformed-for-kind falls back to truncate-middle, never throws -------
  it('falls back to truncate-middle for a malformed CPF', () => {
    expect(maskKeyId('not-a-cpf-at-all', 'pix-cpf')).toBe('not-a-…-all')
  })
  it('falls back for a wrong-length CNPJ', () => {
    expect(maskKeyId('123', 'pix-cnpj')).toBe('123')
  })
  it('falls back for an email with no domain', () => {
    expect(maskKeyId('no-at-sign-here', 'pix-email')).toBe('no-at-…here')
  })
  it('falls back for a non-BR / wrong-length phone', () => {
    expect(maskKeyId('+1 415 555 0100', 'pix-phone')).toBe('+1 415…0100')
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
    expect(maskKeyId(CPF, 'pix-cpf')).not.toContain('25')
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

  it('renders no copy affordance unless copyable is set', () => {
    render(<KeyId value={CPF} kind="pix-cpf" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
