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

    const handleClick = () => {
      for (let i = 1; i <= 5; i++) {
        toast({
          title: `Toast ${i}`,
          description: `This is toast number ${i} of 5.`
        })
      }
    }

    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2">
        <Button onClick={handleClick}>Fire 5 Toasts</Button>
        <p className="text-muted-foreground text-sm">
          Only 3 will be visible at once. Hover to expand.
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
