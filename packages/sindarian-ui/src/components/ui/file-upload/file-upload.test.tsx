import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { FileUpload, validateFile, type FileUploadResult } from '.'

/** Construct a File with a controlled `.size` for the byte-cap path. */
function fakeFile(name: string, type: string, size: number): File {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

/**
 * Pick a file and let FileReader settle. The read resolves on a macrotask, so
 * the yield has to happen inside `act` or React reports the resulting state
 * update as unwrapped.
 */
async function pick(container: HTMLElement, file: File) {
  await act(async () => {
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [file] }
    })
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

describe('validateFile', () => {
  it('rejects a file over the byte cap', () => {
    const error = validateFile(fakeFile('a.pem', '', 10), { maxSizeBytes: 5 })
    expect(error?.kind).toBe('too-large')
    if (error?.kind === 'too-large') expect(error.maxSizeBytes).toBe(5)
  })

  it('rejects a disallowed extension against an extension accept', () => {
    expect(
      validateFile(fakeFile('a.txt', '', 1), { accept: '.pem,.key' })?.kind
    ).toBe('wrong-type')
  })

  it('rejects a disallowed mime against a mime accept', () => {
    expect(
      validateFile(fakeFile('a', 'application/pdf', 1), {
        accept: 'text/plain'
      })?.kind
    ).toBe('wrong-type')
  })

  it('accepts when the extension matches the accept filter', () => {
    expect(
      validateFile(fakeFile('a.pem', '', 1), { accept: '.pem' })
    ).toBeNull()
  })

  it('accepts when the mime matches the accept filter (extension absent)', () => {
    expect(
      validateFile(fakeFile('cert', 'text/plain', 1), {
        accept: 'text/plain,.pem'
      })
    ).toBeNull()
  })

  it('accepts a mime-wildcard accept', () => {
    expect(
      validateFile(fakeFile('cert', 'text/x-pem-file', 1), { accept: 'text/*' })
    ).toBeNull()
  })

  it('accepts any type when accept is omitted', () => {
    expect(
      validateFile(fakeFile('a.bin', 'application/octet-stream', 1), {})
    ).toBeNull()
  })

  it('checks the size cap before the type — a too-large allowed file is too-large', () => {
    expect(
      validateFile(fakeFile('a.pem', '', 100), {
        accept: '.pem',
        maxSizeBytes: 10
      })?.kind
    ).toBe('too-large')
  })
})

describe('FileUpload', () => {
  it('renders a focusable, labelable, sr-only file input as the control', () => {
    const { container } = render(
      <FileUpload id="cert-upload" accept=".pem" onSelect={jest.fn()} />
    )

    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).not.toBeNull()
    expect(input).toHaveAttribute('id', 'cert-upload')
    expect(input).toHaveAttribute('accept', '.pem')
    expect(input).toHaveClass('sr-only')
    // The input is the accessible source of truth: never hidden, never removed
    // from the tab order, and never double-named by a wrapping <label>.
    expect(input).not.toHaveAttribute('aria-hidden')
    expect(input).not.toHaveAttribute('tabindex')
    expect(container.querySelector('label')).toBeNull()
    expect(screen.getByText('Choose a file')).toBeInTheDocument()
  })

  it('spreads the injected ARIA onto the input', () => {
    const { container } = render(
      <FileUpload
        id="cert-upload"
        aria-required
        aria-describedby="cert-desc"
        aria-label="A1 certificate"
        onSelect={jest.fn()}
      />
    )

    const input = container.querySelector('input[type="file"]')
    expect(input).toHaveAttribute('aria-required', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'cert-desc')
    expect(input).toHaveAttribute('aria-label', 'A1 certificate')
  })

  it('reads an accepted file to text and emits { file, text }', async () => {
    const onSelect = jest.fn()
    const { container } = render(
      <FileUpload accept=".pem" onSelect={onSelect} />
    )

    await pick(
      container,
      new File(['PEM BODY'], 'cert.pem', { type: 'text/plain' })
    )

    expect(onSelect).toHaveBeenCalledTimes(1)
    const result = onSelect.mock.calls[0][0] as FileUploadResult
    expect(result.file.name).toBe('cert.pem')
    expect(result.text).toBe('PEM BODY')
  })

  it('rejects a wrong-type pick: announces it, calls onError, and never selects', async () => {
    const onSelect = jest.fn()
    const onError = jest.fn()
    const { container } = render(
      <FileUpload accept=".pem" onSelect={onSelect} onError={onError} />
    )

    await pick(container, new File(['x'], 'notes.txt', { type: 'text/plain' }))

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0].kind).toBe('wrong-type')
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'File type not allowed (expected .pem).'
    )
  })

  it('shows the filename, its size, and a remove control when a value is set', () => {
    const onSelect = jest.fn()
    const value = {
      file: fakeFile('cert.pem', 'text/plain', 2048),
      text: 'PEM'
    }
    render(<FileUpload value={value} onSelect={onSelect} />)

    expect(screen.getByText('cert.pem')).toBeInTheDocument()
    expect(screen.getByText('2.0 KB')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Remove file' }))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('marks the zone and the input invalid when aria-invalid is set', () => {
    const { container } = render(
      <FileUpload aria-invalid onSelect={jest.fn()} />
    )

    expect(container.querySelectorAll('[aria-invalid="true"]')).toHaveLength(2)
  })

  it('disables the native input when disabled', () => {
    const { container } = render(<FileUpload disabled onSelect={jest.fn()} />)

    expect(container.querySelector('input[type="file"]')).toBeDisabled()
  })
})
