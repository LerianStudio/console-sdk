import { Meta, StoryObj } from '@storybook/nextjs'
import { IconButtonProps, IconButton } from '.'
import { EllipsisVertical, Users } from 'lucide-react'

const meta: Meta<IconButtonProps> = {
  title: 'Primitives/IconButton',
  component: IconButton,
  argTypes: {}
}

export default meta

function BaseComponent(args: IconButtonProps) {
  return (
    <IconButton {...args}>
      <Users />
    </IconButton>
  )
}

export const Component: StoryObj<IconButtonProps> = {
  render: (args) => <BaseComponent {...args} />
}

export const Primary: StoryObj<IconButtonProps> = {
  args: {
    children: 'Button'
  },
  render: (args) => (
    <div className="flex gap-2">
      <BaseComponent {...args} /> <BaseComponent {...args} rounded />{' '}
      <BaseComponent {...args} disabled />
      <BaseComponent {...args} rounded disabled />
    </div>
  )
}

export const Secondary: StoryObj<IconButtonProps> = {
  args: {
    children: 'Button',
    variant: 'secondary'
  },
  render: (args) => (
    <div className="flex gap-2">
      <BaseComponent {...args} /> <BaseComponent {...args} rounded />{' '}
      <BaseComponent {...args} disabled />
      <BaseComponent {...args} rounded disabled />
    </div>
  )
}

export const Tertiary: StoryObj<IconButtonProps> = {
  args: {
    children: 'Button',
    variant: 'tertiary'
  },
  render(args) {
    return (
      <div className="flex gap-2">
        <BaseComponent {...args} />
        <BaseComponent {...args} rounded /> <BaseComponent {...args} disabled />
        <BaseComponent {...args} rounded disabled />
      </div>
    )
  }
}

export const Outline: StoryObj<IconButtonProps> = {
  args: {
    children: 'Button',
    variant: 'outline'
  },
  render(args) {
    return (
      <div className="flex gap-2">
        <BaseComponent {...args} />
        <BaseComponent {...args} rounded /> <BaseComponent {...args} disabled />
        <BaseComponent {...args} rounded disabled />
      </div>
    )
  }
}

export const Small: StoryObj<IconButtonProps> = {
  args: {
    children: 'Button',
    size: 'small'
  },
  render: (args) => (
    <div className="flex gap-2">
      <BaseComponent {...args} />
      <BaseComponent variant="secondary" {...args} />
      <BaseComponent variant="tertiary" {...args} />
      <BaseComponent variant="outline" {...args} />
    </div>
  )
}

/**
 * ⛔ THE GLYPH IS 2rem, THE TAP TARGET IS 2.5rem, AND THEY ARE NOT THE SAME
 * BOX.
 *
 * A listing's row-actions kebab is `size="small"` and is the only control in
 * its row, so it was a 32x32 target where every icon control in a console
 * shell is 40x40. Growing the button would have grown the row — `TableCell` is
 * `py-4`, so a `size-10` trigger takes this row from 64.5px to 72.5px — so the
 * target is an absolutely positioned pseudo-element instead: it takes part in
 * hit testing and in no layout at all.
 *
 * The dashed outline below is drawn by this story, not by the component, and
 * marks where `::after` actually is. Click anywhere inside it — including the
 * 4px of apparently empty row above, below and beside the glyph — and the
 * button answers. The row measures the same 64.5px it did before.
 *
 * `scripts/measure-phone-shapes.mjs` walks eight points around that outline
 * and asks the document what is there; on 2.0.0-beta.11 none of them answered.
 */
export const RowActionsTarget: StoryObj = {
  globals: {
    viewport: { value: 'iphone12' }
  },
  render: () => (
    <table className="w-full caption-bottom text-sm">
      <tbody>
        {['Consolidated ledger', 'Settlement ledger'].map((name) => (
          <tr key={name} className="border-b">
            <td className="text-foreground px-6 py-4 align-middle text-sm font-normal">
              {name}
            </td>
            <td className="px-6 py-4 text-center align-middle">
              {/* The outline is the story's, drawn on the same box the
                  pseudo-element occupies so the target is visible at all. */}
              <span className="relative inline-flex">
                <span
                  aria-hidden
                  className="border-ring pointer-events-none absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-md border border-dashed"
                />
                <IconButton
                  variant="secondary"
                  size="small"
                  aria-label={`Actions for ${name}`}
                  onClick={() => alert(`Actions for ${name}`)}
                >
                  <EllipsisVertical />
                </IconButton>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export const ReadOnly: StoryObj<IconButtonProps> = {
  args: {
    children: 'Button',
    readOnly: true
  },
  render: (args) => (
    <div className="flex gap-2">
      <BaseComponent {...args} />
      <BaseComponent variant="secondary" {...args} />
      <BaseComponent variant="tertiary" {...args} />
      <BaseComponent variant="outline" {...args} />
    </div>
  )
}
