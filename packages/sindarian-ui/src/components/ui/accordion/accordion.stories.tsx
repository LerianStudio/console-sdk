import type { ComponentProps } from 'react'
import { Meta, StoryObj } from '@storybook/nextjs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '.'

type AccordionProps = ComponentProps<typeof Accordion>

const meta: Meta<AccordionProps> = {
  title: 'Primitives/Accordion',
  component: Accordion,
  argTypes: {}
}

export default meta

const items = [
  { value: 'pix', title: 'Pix', body: 'Instant rail, settled by BACEN 24/7.' },
  { value: 'ted', title: 'TED', body: 'Same-day wire, business hours only.' },
  { value: 'siloc', title: 'SILOC', body: 'Deferred net settlement, D+1.' }
]

export const Primary: StoryObj<AccordionProps> = {
  render: () => (
    <Accordion type="single" collapsible className="w-96">
      {items.map((item) => (
        <AccordionItem key={item.value} value={item.value}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent>{item.body}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export const Multiple: StoryObj<AccordionProps> = {
  render: () => (
    <Accordion type="multiple" defaultValue={['pix', 'ted']} className="w-96">
      {items.map((item) => (
        <AccordionItem key={item.value} value={item.value}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent>{item.body}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export const Disabled: StoryObj<AccordionProps> = {
  render: () => (
    <Accordion type="single" collapsible className="w-96">
      <AccordionItem value="pix">
        <AccordionTrigger>Pix</AccordionTrigger>
        <AccordionContent>
          Instant rail, settled by BACEN 24/7.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="siloc" disabled>
        <AccordionTrigger>SILOC (unavailable)</AccordionTrigger>
        <AccordionContent>Deferred net settlement, D+1.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
