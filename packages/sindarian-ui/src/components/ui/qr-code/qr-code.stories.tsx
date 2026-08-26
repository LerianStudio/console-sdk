import { Meta, StoryObj } from '@storybook/nextjs'
import { QRCodeProps, QRCode } from '.'

const meta: Meta<QRCodeProps> = {
  title: 'Primitives/QRCode',
  component: QRCode,
  argTypes: {}
}

export default meta

export const Populated: StoryObj<QRCodeProps> = {
  args: {
    value:
      'otpauth://totp/Lerian:user@acme?secret=JBSWY3DPEHPK3PXP&issuer=Lerian',
    'aria-label': 'Scan this QR code with your authenticator app'
  }
}

export const Empty: StoryObj<QRCodeProps> = {
  args: {
    value: ''
  }
}
