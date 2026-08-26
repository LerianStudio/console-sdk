import { Meta, StoryObj } from '@storybook/nextjs'

import { ModeToggle } from './mode-toggle'
import { ThemeProvider, useTheme } from './theme-provider'

const meta: Meta<typeof ModeToggle> = {
  title: 'Theme/ModeToggle',
  component: ModeToggle,
  parameters: {
    docs: {
      description: {
        component:
          'Segmented light/system/dark control. Requires a `ThemeProvider` ancestor; ' +
          'the provider owns the `.dark` class on the document root and persists the ' +
          'preference to localStorage. Pair with `getThemeScript()` in the page head to ' +
          'remove the pre-hydration flash.'
      }
    }
  }
}

export default meta

function ThemeReadout() {
  const { theme, resolvedTheme } = useTheme()
  return (
    <p className="text-muted-foreground text-sm">
      preference: <span className="text-foreground font-mono">{theme}</span> —
      resolved:{' '}
      <span className="text-foreground font-mono">{resolvedTheme}</span>
    </p>
  )
}

export const Component: StoryObj<typeof ModeToggle> = {
  render: (args) => (
    <ThemeProvider storageKey="storybook.theme">
      <div className="bg-background flex flex-col items-start gap-4 p-6">
        <ModeToggle {...args} />
        <ThemeReadout />
      </div>
    </ThemeProvider>
  )
}

export const Localized: StoryObj<typeof ModeToggle> = {
  args: {
    labels: {
      light: 'Claro',
      system: 'Sistema',
      dark: 'Escuro',
      group: 'Tema'
    }
  },
  render: Component.render
}
