import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { RadioGroup, RadioGroupItem } from '.'

// Radix measures the indicator with ResizeObserver, which jsdom does not ship.
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

describe('RadioGroup', () => {
  it('selects the clicked option and reports the value', () => {
    const onValueChange = jest.fn()
    render(
      <RadioGroup defaultValue="pix" onValueChange={onValueChange}>
        <RadioGroupItem value="pix" aria-label="Pix" />
        <RadioGroupItem value="ted" aria-label="TED" />
      </RadioGroup>
    )

    const pix = screen.getByRole('radio', { name: 'Pix' })
    const ted = screen.getByRole('radio', { name: 'TED' })
    expect(pix).toBeChecked()
    expect(ted).not.toBeChecked()

    fireEvent.click(ted)

    expect(onValueChange).toHaveBeenCalledWith('ted')
    expect(ted).toBeChecked()
  })

  it('does not select a disabled option', () => {
    const onValueChange = jest.fn()
    render(
      <RadioGroup onValueChange={onValueChange}>
        <RadioGroupItem value="ted" aria-label="TED" disabled />
      </RadioGroup>
    )

    fireEvent.click(screen.getByRole('radio', { name: 'TED' }))

    expect(onValueChange).not.toHaveBeenCalled()
  })
})
