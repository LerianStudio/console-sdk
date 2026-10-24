import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { RadioGroup, RadioGroupItem } from '.'

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

  // The rest border is the --ring step, so the focus border swap shows nothing;
  // the opaque ring is the focus indicator.
  it('marks keyboard focus with an opaque ring', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="pix" aria-label="Pix" />
      </RadioGroup>
    )

    expect(screen.getByRole('radio', { name: 'Pix' })).toHaveClass(
      'focus-visible:ring-ring'
    )
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
