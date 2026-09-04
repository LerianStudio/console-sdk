'use client'

/**
 * KeyId — a masked, copyable, traceable identifier for Brazilian rails: a Pix
 * key (CPF / CNPJ / email / phone / EVP-random), an End-to-End id (E2E), an
 * idempotency key, or a generic id.
 *
 * Two jobs at once. PII keys (CPF/CNPJ/email/phone) are masked by default so a
 * shared screen or a screenshot doesn't leak a person's document or contact —
 * the middle of a document is revealed, the identifying head/tail is dotted.
 * Long-but-not-secret ids (EVP/E2E/idempotency/generic) are merely truncated in
 * the MIDDLE so the head and tail — the parts an operator eyeballs against a
 * log — stay legible.
 *
 *   <KeyId value="529.982.247-25" kind="pix-cpf" label="Payer" copyable />
 *   <KeyId value="E32074158202406211200abc123def456" kind="e2e" copyable />
 *
 * The copy button always lifts the RAW, unmasked value to the clipboard — the
 * mask is a display concern, never a data one. The masked render and the copy
 * affordance are what make this a client component.
 */
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { LABEL_VOICE_CLASS } from '@/lib/typography'
import { cn } from '@/lib/utils'

export type KeyIdKind =
  | 'pix-cpf'
  | 'pix-cnpj'
  | 'pix-email'
  | 'pix-phone'
  | 'pix-evp'
  | 'e2e'
  | 'idempotency'
  | 'generic'

export interface KeyIdProps {
  value: string
  /** What the value is. Drives the mask shape and the default mask state. */
  kind?: KeyIdKind
  /** Optional quiet label rendered before the value (e.g. 'Payer', 'E2E'). */
  label?: string
  /** Override the per-kind mask default. PII kinds default true, ids default false. */
  mask?: boolean
  /** Show a button that copies the RAW (unmasked) value to the clipboard. */
  copyable?: boolean
  /** BCP 47 locale — reserved for future locale-aware id formatting. */
  locale?: string
  className?: string
}

/** The dot used to redact a character. A bullet, not an asterisk: it reads as
 *  "hidden" without looking like a password field's shouting. */
const DOT = '•'

/** Kinds that carry PII and are masked by default. The id-shaped kinds are long
 *  but not secret, so they default to revealed (just truncated). */
const PII_KINDS = new Set<KeyIdKind>([
  'pix-cpf',
  'pix-cnpj',
  'pix-email',
  'pix-phone'
])

/** Whether a kind masks by default (PII) — used when `mask` is not supplied.
 *  Internal: exported for its unit tests, never from `src/domain/index.ts`. */
export function masksByDefault(kind: KeyIdKind): boolean {
  return PII_KINDS.has(kind)
}

/** Keep only the digits — Brazilian documents arrive punctuated or bare. */
function digitsOf(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Truncate the MIDDLE of a long value, keeping a head and tail so an operator
 * can eyeball it against a log. Short values are returned whole.
 */
function truncateMiddle(value: string, head = 6, tail = 4): string {
  if (value.length <= head + tail + 1) return value
  return `${value.slice(0, head)}…${value.slice(-tail)}`
}

/**
 * The fallback for a PII value that is MALFORMED for its kind. It must not be
 * `truncateMiddle`: a short malformed value (a CPF missing a digit, a hand-typed
 * document, a name-shaped email that failed the `@` check) is returned WHOLE by
 * truncation, so the "masked" render leaks the very PII the mask exists to hide.
 * A fixed-width dot run reveals nothing — not the content, not even the length.
 *
 * DELIBERATE DIVERGENCE from sindarian-x@0.15.0, which truncated instead. It
 * costs the operator the ability to eyeball a malformed document against a log;
 * that is the correct trade, because the alternative is a screenshot with a real
 * CPF in it. An operator who needs the value passes `mask={false}` explicitly.
 */
function redactPii(): string {
  return DOT.repeat(6)
}

/** Mask all but the central block of a digit string, then re-punctuate it. */
function maskCpf(value: string): string {
  const d = digitsOf(value)
  if (d.length !== 11) return redactPii()
  // Reveal the middle two blocks (456.789), dot the leading block and check digits.
  return `${DOT.repeat(3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${DOT.repeat(2)}`
}

function maskCnpj(value: string): string {
  const d = digitsOf(value)
  if (d.length !== 14) return redactPii()
  // Reveal the central registration blocks, dot the head and the check digits.
  return `${DOT.repeat(2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${DOT.repeat(2)}`
}

function maskEmail(value: string): string {
  const at = value.indexOf('@')
  if (at <= 0 || at === value.length - 1) return redactPii()
  // EXACTLY one '@', or it is not an address and the domain half cannot be
  // trusted to be a domain. `a@private@domain.test` split on the FIRST '@' and
  // published `private@domain.test` verbatim as the "domain" — the local part of
  // a second address, revealed in a view whose whole purpose is to hide it.
  // Malformed PII redacts, exactly like a wrong-length CPF.
  if (value.indexOf('@', at + 1) !== -1) return redactPii()
  const first = value.slice(0, 1)
  const domain = value.slice(at + 1)
  return `${first}${DOT.repeat(3)}@${domain}`
}

function maskPhone(value: string): string {
  const d = digitsOf(value)
  // Expect a BR mobile in E.164-ish form: 55 + 2-digit area + 9 subscriber digits.
  if (d.length !== 13 || !d.startsWith('55')) return redactPii()
  const area = d.slice(2, 4)
  const last2 = d.slice(-2)
  // Keep country + area, reveal the last two, dot the rest of the subscriber run.
  return `+55 (${area}) ${DOT.repeat(5)}-${DOT.repeat(2)}${last2}`
}

/**
 * Mask a key for display. PII kinds get a structured mask that reveals a
 * non-identifying middle and dots the rest; a value MALFORMED for its kind is
 * redacted outright (see `redactPii`) rather than truncated, so a mask can never
 * fall through to the raw secret. Id-shaped kinds are always middle-truncated
 * (long, not secret). The copy path never uses this — it always sends the raw
 * value.
 *
 * Internal: exported for its unit tests, never from `src/domain/index.ts`.
 */
export function maskKeyId(value: string, kind: KeyIdKind): string {
  switch (kind) {
    case 'pix-cpf':
      return maskCpf(value)
    case 'pix-cnpj':
      return maskCnpj(value)
    case 'pix-email':
      return maskEmail(value)
    case 'pix-phone':
      return maskPhone(value)
    default:
      return truncateMiddle(value)
  }
}

export function KeyId({
  value,
  kind = 'generic',
  label,
  mask,
  copyable = false,
  className
}: KeyIdProps) {
  const masked = mask ?? masksByDefault(kind)
  const display = masked ? maskKeyId(value, kind) : truncateMiddle(value)

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
      {label ? (
        // `text-xs` displaces the voice's `text-sm`: the value beside it is a
        // 12px mono identifier, and a 14px label would outshout what it names.
        <span className={cn(LABEL_VOICE_CLASS, 'shrink-0 text-xs')}>
          {label}
        </span>
      ) : null}

      <span
        className="text-foreground truncate font-mono text-xs tabular-nums"
        // The raw value as a tooltip only when nothing is hidden — never leak a
        // masked PII value through the title attribute.
        title={masked ? undefined : value}
      >
        {display}
      </span>

      {copyable ? <CopyValue value={value} /> : null}
    </span>
  )
}

/** The copy affordance: lifts the RAW value to the clipboard and flips to a
 *  check for a beat. The transient confirmation is announced for assistive tech;
 *  the icon is paired with a text aria-label so the state isn't color-only. */
function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    // ponytail: best-effort clipboard write — no toast, no error surface. The
    // ceiling is silent failure in an insecure context (clipboard unavailable);
    // upgrade path is to lift a result up via an onCopy callback when a caller
    // needs to react.
    //
    // The rejection handler is NOT optional: `writeText` rejects on a denied
    // permission or a non-secure context, and an unhandled rejection in a render
    // tree is a console error at best and a crashed handler at worst. On failure
    // the button simply does not flip to the copied state, so the operator sees
    // that nothing was copied rather than a false confirmation.
    void navigator.clipboard
      ?.writeText(value)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {
        setCopied(false)
      })
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={
        copied ? 'Copiado para a área de transferência' : 'Copiar valor'
      }
      className="text-muted-foreground hover:text-foreground focus:ring-ring inline-flex size-5 shrink-0 items-center justify-center rounded-sm transition-colors duration-150 ease-out focus:ring-2 focus:outline-none"
    >
      {copied ? (
        <Check aria-hidden className="text-system-success size-3" />
      ) : (
        <Copy aria-hidden className="size-3" />
      )}
    </button>
  )
}
