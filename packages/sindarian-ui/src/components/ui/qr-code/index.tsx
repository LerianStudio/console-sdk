'use client'

import { QRCodeSVG } from 'qrcode.react'

export type QRCodeProps = {
  /**
   * The `otpauth://totp/...` URI to encode. An empty or whitespace-only value
   * renders nothing (never a broken QR).
   */
  value: string
  /**
   * Rendered square edge in px. Drives both width and height of the SVG.
   * @defaultValue 160
   */
  size?: number
  /**
   * Optional image URL rendered in the center of the code (e.g. a brand logo).
   * When set, the error-correction level is raised to `H` so the code stays
   * scannable despite the occluded modules, and the modules behind the image
   * are excavated to the background color.
   */
  logoSrc?: string
  /**
   * Accessible name for the QR image. Falls back to a generic label when
   * omitted. Consumers should pass an i18n string.
   */
  'aria-label'?: string
}

const DEFAULT_SIZE = 160
const DEFAULT_ARIA_LABEL = 'QR code'
/**
 * Center image edge as a fraction of the code size. Kept small so error
 * correction can recover the excavated modules.
 */
const LOGO_SIZE_RATIO = 0.22

export function QRCode({
  value,
  size = DEFAULT_SIZE,
  logoSrc,
  'aria-label': ariaLabel = DEFAULT_ARIA_LABEL
}: QRCodeProps) {
  if (!value || value.trim() === '') {
    return null
  }

  const logoSize = Math.round(size * LOGO_SIZE_RATIO)

  return (
    <QRCodeSVG
      data-slot="qr-code"
      value={value}
      size={size}
      role="img"
      aria-label={ariaLabel}
      level={logoSrc ? 'H' : 'L'}
      imageSettings={
        logoSrc
          ? {
              src: logoSrc,
              height: logoSize,
              width: logoSize,
              excavate: true
            }
          : undefined
      }
    />
  )
}
