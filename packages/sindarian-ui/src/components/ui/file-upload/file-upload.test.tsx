import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FileUpload, validateFile, type FileUploadResult } from '.'

/** Construct a File with a controlled `.size` for the byte-cap path. */
function fakeFile(name: string, type: string, size: number): File {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

/**
 * Pick a file. The FileReader read settles asynchronously and on a loaded
 * machine can take more than one macrotask tick, so callers must `waitFor` the
 * outcome — never a fixed delay, which turns into a flaky race under parallel
 * test workers.
 */
function pick(container: HTMLElement, file: File) {
  fireEvent.change(container.querySelector('input[type="file"]')!, {
    target: { files: [file] }
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

    pick(container, new File(['PEM BODY'], 'cert.pem', { type: 'text/plain' }))

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1))
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

    pick(container, new File(['x'], 'notes.txt', { type: 'text/plain' }))

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
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

  it('accepts a dropped file through the same validate-and-read path', async () => {
    const onSelect = jest.fn()
    const { container } = render(
      <FileUpload accept=".pem" onSelect={onSelect} />
    )

    const zone = container.querySelector('input[type="file"]')!
      .parentElement as HTMLElement
    fireEvent.drop(zone, {
      dataTransfer: {
        files: [new File(['DROPPED'], 'cert.pem', { type: 'text/plain' })]
      }
    })

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1))
    expect((onSelect.mock.calls[0][0] as FileUploadResult).text).toBe('DROPPED')
  })

  it('rejects a dropped file that fails the accept filter', async () => {
    const onSelect = jest.fn()
    const onError = jest.fn()
    const { container } = render(
      <FileUpload accept=".pem" onSelect={onSelect} onError={onError} />
    )

    const zone = container.querySelector('input[type="file"]')!
      .parentElement as HTMLElement
    fireEvent.drop(zone, {
      dataTransfer: {
        files: [new File(['x'], 'notes.txt', { type: 'text/plain' })]
      }
    })

    // Wait on the positive signal first — asserting the negative alone would
    // pass instantly, before the read even had a chance to run.
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
    expect(onError.mock.calls[0][0].kind).toBe('wrong-type')
    expect(onSelect).not.toHaveBeenCalled()
  })
})

/**
 * A FileReader whose completion the test fires by hand, so the read-failure and
 * out-of-order-read paths can be driven deterministically.
 */
class ControllableFileReader {
  static instances: ControllableFileReader[] = []
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  result: string | null = null
  aborted = false
  file?: File

  constructor() {
    ControllableFileReader.instances.push(this)
  }

  readAsText(file: File) {
    this.file = file
  }

  abort() {
    this.aborted = true
  }

  succeed(text: string) {
    this.result = text
    act(() => this.onload?.())
  }

  fail() {
    act(() => this.onerror?.())
  }
}

describe('FileUpload read failures and out-of-order reads', () => {
  const RealFileReader = global.FileReader

  beforeEach(() => {
    ControllableFileReader.instances = []
    global.FileReader = ControllableFileReader as unknown as typeof FileReader
  })

  afterEach(() => {
    global.FileReader = RealFileReader
  })

  function select(container: HTMLElement, file: File) {
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [file] }
    })
  }

  it('announces a read failure, reports it, and never selects', () => {
    const onSelect = jest.fn()
    const onError = jest.fn()
    const { container } = render(
      <FileUpload onSelect={onSelect} onError={onError} />
    )

    select(container, new File(['x'], 'cert.pem', { type: 'text/plain' }))
    ControllableFileReader.instances[0].fail()

    expect(onSelect).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0].kind).toBe('read-failed')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not read the file.'
    )
  })

  it('ignores a stale read that resolves after a newer pick (last resolved wins)', () => {
    const onSelect = jest.fn()
    const { container } = render(<FileUpload onSelect={onSelect} />)

    select(container, new File(['x'], 'first.pem', { type: 'text/plain' }))
    select(container, new File(['x'], 'second.pem', { type: 'text/plain' }))

    const [first, second] = ControllableFileReader.instances
    expect(first.aborted).toBe(true)

    // The slow first read lands last — it must not overwrite the newer pick.
    second.succeed('SECOND')
    first.succeed('FIRST')

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect((onSelect.mock.calls[0][0] as FileUploadResult).text).toBe('SECOND')
    expect((onSelect.mock.calls[0][0] as FileUploadResult).file.name).toBe(
      'second.pem'
    )
  })
})
