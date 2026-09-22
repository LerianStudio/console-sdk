import { Meta, StoryObj } from '@storybook/nextjs'
import { Toaster } from './toaster'
import { Button } from '../button'
import { useToast } from '@/hooks/use-toast'

const meta: Meta<typeof Toaster> = {
  title: 'Primitives/Toast',
  component: Toaster
}

export default meta

export const Default: StoryObj<typeof Toaster> = {
  render: () => {
    const { toast } = useToast()

    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2">
        <Button
          onClick={() =>
            toast({
              title: 'Default Toast',
              description: 'This is a default toast message.'
            })
          }
        >
          Show Default
        </Button>
        <Toaster />
      </div>
    )
  }
}

export const Success: StoryObj<typeof Toaster> = {
  render: () => {
    const { toast } = useToast()

    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2">
        <Button
          onClick={() =>
            toast({
              title: 'Success!',
              description: 'Operation completed successfully.',
              variant: 'success'
            })
          }
        >
          Show Success
        </Button>
        <Toaster />
      </div>
    )
  }
}

export const Warning: StoryObj<typeof Toaster> = {
  render: () => {
    const { toast } = useToast()

    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2">
        <Button
          onClick={() =>
            toast({
              title: 'Heads up',
              description: 'The request went through, but only partially.',
              variant: 'warning'
            })
          }
        >
          Show Warning
        </Button>
        <Toaster />
      </div>
    )
  }
}

export const Destructive: StoryObj<typeof Toaster> = {
  render: () => {
    const { toast } = useToast()

    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2">
        <Button
          onClick={() =>
            toast({
              title: 'Error',
              description: 'Something went wrong. This toast persists.',
              variant: 'destructive'
            })
          }
        >
          Show Destructive
        </Button>
        <Toaster />
      </div>
    )
  }
}

export const QueueBehavior: StoryObj<typeof Toaster> = {
  render: () => {
    const { toast } = useToast()

    const fireDefaults = () => {
      for (let i = 1; i <= 5; i++) {
        toast({
          title: `Toast ${i}`,
          description: `This is toast number ${i} of 5.`
        })
      }
    }

    const fireDistinctErrors = () => {
      for (let i = 1; i <= 5; i++) {
        toast({
          title: `Error ${i}`,
          description: `Entry ${i} was refused by the ledger.`,
          variant: 'destructive'
        })
      }
    }

    const fireSameError = () => {
      for (let i = 1; i <= 5; i++) {
        toast({
          title: 'Error',
          description: 'The ledger refused the entry.',
          variant: 'destructive'
        })
      }
    }

    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <Button onClick={fireDefaults}>Fire 5 Toasts</Button>
        <Button variant="secondary" onClick={fireDistinctErrors}>
          Fire 5 Distinct Errors
        </Button>
        <Button variant="secondary" onClick={fireSameError}>
          Fire the Same Error 5x
        </Button>
        <p className="text-muted-foreground text-sm">
          Only 3 are visible at once. Hover to expand. Five distinct errors pile
          up and none auto-close, so the last two stay out of reach until one is
          dismissed; the same error five times collapses onto a single toast.
        </p>
        <Toaster />
      </div>
    )
  }
}

export const DescriptionOnly: StoryObj<typeof Toaster> = {
  render: () => {
    const { toast } = useToast()

    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2">
        <Button
          onClick={() =>
            toast({
              description: 'Copied to clipboard'
            })
          }
        >
          Show Description Only
        </Button>
        <Toaster />
      </div>
    )
  }
}
