import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '.'
import { Meta, StoryObj } from '@storybook/nextjs'
import { Button } from '../button'

const meta: Meta = {
  title: 'Primitives/Sheet',
  component: Sheet,
  argTypes: {}
}

export default meta

export const Primary: StoryObj = {
  render: (args) => (
    <Sheet {...args}>
      <SheetTrigger>Open</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Are you absolutely sure?</SheetTitle>
          <SheetDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}

/**
 * ⛔ THE PANEL USED TO STAY TWO FIFTHS WIDE ON A PHONE.
 *
 * `w-2/5` with `p-12`, at every viewport. At the 390px this story opens at
 * (iPhone 12), that was a 156px panel with 59px of usable width and a field
 * 41px wide carrying 9px of text; at 320px the panel was 128px and the field
 * had nothing at all, because its own padding is wider than its box.
 *
 * Below `sm` the panel now fills the screen and drops its side padding from
 * 48px to 16px. Widen the preview past 640px and the desktop panel comes back
 * unchanged — that half is byte-identical to what this component has always
 * shipped.
 *
 * A caller that declares its own width keeps it AND gets this, because the
 * phone values carry the `max-sm:` modifier and tailwind-merge only drops a
 * conflicting class with matching modifiers. A caller that wants its own phone
 * width says `max-sm:w-[…]`, which does reach it.
 */
export const PhoneWidth: StoryObj = {
  globals: {
    viewport: { value: 'iphone12' }
  },
  render: () => (
    <Sheet open>
      <SheetContent side="right" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>New ledger</SheetTitle>
          <SheetDescription>
            One field, to show how much of it is reachable.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-2">
          <label
            className="text-muted-foreground text-sm font-semibold"
            htmlFor="phone-width-name"
          >
            Name
          </label>
          <div className="input-wrapper input-wrapper-focus">
            <input
              id="phone-width-name"
              className="input-base"
              defaultValue="Consolidated ledger"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

const SHEET_SIDES = ['top', 'right', 'bottom', 'left'] as const

type SheetSide = (typeof SHEET_SIDES)[number]

export const SheetSide: StoryObj = {
  render: (args) => {
    return (
      <div className="grid grid-cols-2 gap-2">
        {SHEET_SIDES.map((side) => (
          <Sheet key={side} {...args}>
            <SheetTrigger asChild>
              <Button variant="outline">{side}</Button>
            </SheetTrigger>
            <SheetContent side={side}>
              <SheetHeader>
                <SheetTitle>Edit profile</SheetTitle>
                <SheetDescription>
                  Make changes to your profile here. Click save when you are
                  done.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <p>Content</p>
                <p>Content</p>
                <p>Content</p>
                <p>Content</p>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button type="submit">Save changes</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        ))}
      </div>
    )
  }
}
