import * as React from 'react'
import { Meta, StoryObj } from '@storybook/nextjs'
import { TimePicker, TimePickerProps } from '.'

const meta: Meta<TimePickerProps> = {
  title: 'Primitives/TimePicker',
  component: TimePicker,
  argTypes: {}
}

export default meta

export const Primary: StoryObj<TimePickerProps> = {
  render: function Render(args) {
    const [hour, setHour] = React.useState(0)
    const [minute, setMinute] = React.useState(0)

    return (
      <TimePicker
        {...args}
        hour={hour}
        minute={minute}
        onChange={(time) => {
          setHour(time.hour)
          setMinute(time.minute)
        }}
      />
    )
  }
}

export const WithValue: StoryObj<TimePickerProps> = {
  render: function Render(args) {
    const [hour, setHour] = React.useState(10)
    const [minute, setMinute] = React.useState(3)

    return (
      <TimePicker
        {...args}
        hour={hour}
        minute={minute}
        onChange={(time) => {
          setHour(time.hour)
          setMinute(time.minute)
        }}
      />
    )
  }
}

export const Disabled: StoryObj<TimePickerProps> = {
  render: function Render(args) {
    const [hour, setHour] = React.useState(14)
    const [minute, setMinute] = React.useState(30)

    return (
      <TimePicker
        {...args}
        hour={hour}
        minute={minute}
        disabled
        onChange={(time) => {
          setHour(time.hour)
          setMinute(time.minute)
        }}
      />
    )
  }
}

export const CustomLabels: StoryObj<TimePickerProps> = {
  render: function Render(args) {
    const [hour, setHour] = React.useState(10)
    const [minute, setMinute] = React.useState(3)

    return (
      <TimePicker
        {...args}
        hour={hour}
        minute={minute}
        hourLabel="Hora"
        minuteLabel="Minuto"
        onChange={(time) => {
          setHour(time.hour)
          setMinute(time.minute)
        }}
      />
    )
  }
}
