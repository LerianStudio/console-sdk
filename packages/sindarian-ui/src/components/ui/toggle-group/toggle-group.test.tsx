import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { ToggleGroup, ToggleGroupItem } from '.'

describe('ToggleGroup', () => {
  it('turns the clicked item on and reports the value', () => {
    const onValueChange = jest.fn()
    render(
      <ToggleGroup type="single" onValueChange={onValueChange}>
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
      </ToggleGroup>
    )

    const week = screen.getByRole('radio', { name: 'Week' })
    expect(week).toHaveAttribute('data-state', 'off')

    fireEvent.click(week)

    expect(onValueChange).toHaveBeenCalledWith('week')
    expect(week).toHaveAttribute('data-state', 'on')
  })

  it('keeps a caller style alongside the internal gap variable', () => {
    const { container } = render(
      <ToggleGroup
        type="single"
        spacing={2}
        style={{ backgroundColor: 'rgb(1, 2, 3)' }}
      >
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
      </ToggleGroup>
    )

    const group = container.querySelector<HTMLElement>(
      '[data-slot="toggle-group"]'
    )!
    expect(group.style.backgroundColor).toBe('rgb(1, 2, 3)')
    expect(group.style.getPropertyValue('--gap')).toBe('2')
  })

  it('passes the group variant and size down to its items', () => {
    render(
      <ToggleGroup type="single" variant="outline" size="sm">
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
      </ToggleGroup>
    )

    const item = screen.getByRole('radio', { name: 'Day' })
    expect(item).toHaveAttribute('data-variant', 'outline')
    expect(item).toHaveAttribute('data-size', 'sm')
  })
})
