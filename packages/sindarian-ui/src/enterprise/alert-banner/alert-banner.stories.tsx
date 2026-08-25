import { Meta, StoryObj } from '@storybook/nextjs'
import { TriangleAlert } from 'lucide-react'
import { AlertBanner, AlertBannerProps } from '.'

const meta: Meta<AlertBannerProps> = {
  title: 'Enterprise/AlertBanner',
  component: AlertBanner,
  argTypes: {
    tone: {
      control: 'select',
      options: ['neutral', 'info', 'success', 'warning', 'destructive']
    }
  }
}

export default meta

export const Neutral: StoryObj<AlertBannerProps> = {
  args: {
    title: 'Scheduled maintenance',
    children: 'Settlement runs pause between 02:00 and 03:00 UTC.'
  }
}

export const Info: StoryObj<AlertBannerProps> = {
  args: {
    tone: 'info',
    title: 'Heads up',
    children: 'A newer file is available.'
  }
}

export const Success: StoryObj<AlertBannerProps> = {
  args: {
    tone: 'success',
    title: 'Import complete',
    children: '1,204 rows ingested.'
  }
}

export const Warning: StoryObj<AlertBannerProps> = {
  args: {
    tone: 'warning',
    title: 'Partial match',
    children: '12 rows need manual review.',
    icon: <TriangleAlert className="size-4" />
  }
}

export const DestructiveWithDetail: StoryObj<AlertBannerProps> = {
  args: {
    tone: 'destructive',
    title: 'Import failed',
    children: 'The file could not be parsed. No rows were ingested.',
    detail: 'ERR_PARSE_0042 at line 18: unexpected delimiter'
  }
}
