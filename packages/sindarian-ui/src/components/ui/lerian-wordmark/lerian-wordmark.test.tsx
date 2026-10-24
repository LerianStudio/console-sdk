import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import { LerianWordmark } from '.'

describe('LerianWordmark', () => {
  it('is an image named Lerian by default', () => {
    render(<LerianWordmark />)

    expect(screen.getByRole('img', { name: 'Lerian' })).toBeInTheDocument()
  })

  it('takes a custom accessible name', () => {
    render(<LerianWordmark title="Lerian Studio" />)

    expect(
      screen.getByRole('img', { name: 'Lerian Studio' })
    ).toBeInTheDocument()
  })
})
