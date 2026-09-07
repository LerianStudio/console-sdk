import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  FileUpload,
  humanizeSize,
  validateFile,
  type FileUploadError,
  type FileUploadProps,
  type FileUploadResult
} from '.'

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

  // The browser fires `change` only when the selection DIFFERS from what the
  // input already holds. Holding on to the FileList made re-picking the same
  // file after a host reset a silent no-op: the picker opened, the user chose
  // the file, and nothing happened. jsdom does not model that suppression (and
  // fireEvent pins `files` as an own property, so the real value setter cannot
  // empty it), so the observable contract is the write itself.
  describe('releases the native input after reading it', () => {
    /** Watch what the component assigns to the input's `value`. */
    function watchValue(container: HTMLElement) {
      const input =
        container.querySelector<HTMLInputElement>('input[type="file"]')!
      const setValue = jest.fn()
      Object.defineProperty(input, 'value', {
        configurable: true,
        get: () => '',
        set: setValue
      })
      return setValue
    }

    it('clears it after an accepted pick, so the same file can be picked again', async () => {
      const onSelect = jest.fn()
      const { container } = render(
        <FileUpload accept=".pem" onSelect={onSelect} />
      )
      const setValue = watchValue(container)

      pick(
        container,
        new File(['PEM BODY'], 'cert.pem', { type: 'text/plain' })
      )
      await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1))
      expect(setValue).toHaveBeenCalledWith('')

      // The same file again: with the input released this is a real change.
      pick(
        container,
        new File(['PEM BODY'], 'cert.pem', { type: 'text/plain' })
      )
      await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(2))
      expect(setValue).toHaveBeenCalledTimes(2)
    })

    it('clears it after a REJECTED pick too', async () => {
      // Retrying the same rejected file is the commonest way to hit this: the
      // user changes nothing, picks again, and expects the error to reappear.
      const onError = jest.fn()
      const { container } = render(
        <FileUpload accept=".pem" onSelect={jest.fn()} onError={onError} />
      )
      const setValue = watchValue(container)

      pick(container, new File(['x'], 'notes.txt', { type: 'text/plain' }))
      await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
      expect(setValue).toHaveBeenCalledWith('')
    })
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

/**
 * L1 — binary files. `readAs="none"` is the mode a PDF/XLSX/PFX needs: hand the
 * File over with the bytes untouched. The assertion is on what reaches the
 * CONSUMER (the exact File instance, and no reader constructed at all), not on
 * which FileReader method got called.
 */
describe('FileUpload readAs', () => {
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

  it('hands the File over undecoded and never constructs a reader', () => {
    const onSelect = jest.fn()
    const pdf = fakeFile('statement.pdf', 'application/pdf', 20 * 1024 * 1024)
    const { container } = render(
      <FileUpload readAs="none" onSelect={onSelect} />
    )

    select(container, pdf)

    // Synchronous: nothing is read, so there is nothing to await. A component
    // that still decoded would have deferred this to a reader callback.
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect((onSelect.mock.calls[0][0] as FileUploadResult).file).toBe(pdf)
    expect(ControllableFileReader.instances).toHaveLength(0)
  })

  it('still validates size and type before handing the File over', () => {
    const onSelect = jest.fn()
    const onError = jest.fn()
    const { container } = render(
      <FileUpload
        readAs="none"
        accept=".pdf"
        maxSizeBytes={1024}
        onSelect={onSelect}
        onError={onError}
      />
    )

    select(container, fakeFile('big.pdf', 'application/pdf', 2048))

    expect(onSelect).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0].kind).toBe('too-large')
  })

  it('decodes as UTF-8 by default, so an existing consumer is untouched', () => {
    const onSelect = jest.fn()
    const { container } = render(<FileUpload onSelect={onSelect} />)

    select(container, new File(['PEM'], 'cert.pem', { type: 'text/plain' }))
    expect(ControllableFileReader.instances).toHaveLength(1)
    ControllableFileReader.instances[0].succeed('PEM')

    expect((onSelect.mock.calls[0][0] as FileUploadResult).text).toBe('PEM')
  })

  it('clears a stale rejection when a later readAs="none" pick is accepted', () => {
    // The refusal alert is the primitive's own state. A mode that returns early
    // must still retire it, or the zone shows a red error over a good file.
    const onSelect = jest.fn()
    const { container } = render(
      <FileUpload readAs="none" accept=".pdf" onSelect={onSelect} />
    )

    select(container, fakeFile('notes.txt', 'text/plain', 10))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    select(container, fakeFile('ok.pdf', 'application/pdf', 10))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})

/**
 * L2 — every user-visible string is the consumer's. Lerian consoles are
 * trilingual, and these three were the last English text a pt-BR operator
 * could not translate.
 */
describe('FileUpload labels', () => {
  it('renders consumer copy for the affordance instead of the English default', () => {
    render(
      <FileUpload
        onSelect={jest.fn()}
        labels={{ action: 'Escolha um arquivo', hint: 'ou arraste e solte' }}
      />
    )

    expect(screen.getByText('Escolha um arquivo')).toBeInTheDocument()
    expect(screen.getByText(/ou arraste e solte/)).toBeInTheDocument()
    expect(screen.queryByText('Choose a file')).not.toBeInTheDocument()
  })

  it('names the clear button with consumer copy', () => {
    render(
      <FileUpload
        value={{ file: fakeFile('cert.pem', 'text/plain', 10), text: 'PEM' }}
        onSelect={jest.fn()}
        labels={{ remove: 'Remover arquivo' }}
      />
    )

    expect(
      screen.getByRole('button', { name: 'Remover arquivo' })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Remove file' })
    ).not.toBeInTheDocument()
  })

  it('announces a refusal in consumer copy, with the payload to interpolate', async () => {
    const onSelect = jest.fn()
    const { container } = render(
      <FileUpload
        accept=".pem"
        maxSizeBytes={1024}
        onSelect={onSelect}
        labels={{
          error: (failure) =>
            failure.kind === 'too-large'
              ? `Arquivo grande demais (máx ${humanizeSize(failure.maxSizeBytes)}).`
              : 'Recusado.'
        }}
      />
    )

    pick(container, fakeFile('big.pem', 'text/plain', 4096))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Arquivo grande demais (máx 1.0 KB).'
      )
    )
  })

  it('stays silent when the host announces the refusal itself', async () => {
    // Two announcements in two languages for one event is the accessibility
    // defect. A host that toasts in its own locale opts the library out.
    const onError = jest.fn()
    const { container } = render(
      <FileUpload
        accept=".pem"
        onSelect={jest.fn()}
        onError={onError}
        labels={{ error: () => null }}
      />
    )

    pick(container, fakeFile('notes.txt', 'text/plain', 10))

    // Wait on the positive signal — asserting only the absent alert would pass
    // before the pick was even processed.
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    // Silence must not leave a dangling association pointing at nothing.
    const input = container.querySelector('input[type="file"]')!
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBeNull()

    // Still reads as invalid: the pick was refused, silence is only about copy.
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('keeps the English defaults when no labels are passed', () => {
    render(<FileUpload onSelect={jest.fn()} />)
    expect(screen.getByText('Choose a file')).toBeInTheDocument()
  })
})

/**
 * L3 — `onError` was missing from the props `Omit` list, so it intersected with
 * React's own `onError` DOM handler and no concretely typed handler could be
 * assigned. Measured before the fix:
 *
 *   Type '(failure: FileUploadError) => void' is not assignable to type
 *   '((error: FileUploadError) => void) & ReactEventHandler<HTMLInputElement>'
 *
 * Every existing test passed `jest.fn()`, which is assignable to anything —
 * which is exactly why the intersection shipped. These two hold it down: the
 * type-level one fails to COMPILE if the intersection comes back, the runtime
 * one proves the documented `'kind' in failure` guard actually enters.
 */
const typedRejectionHandler = (failure: FileUploadError): string => failure.kind

describe('FileUpload onError is reachable', () => {
  it('accepts a concretely typed handler at the type level', () => {
    // Both assignment directions. Either one stops compiling if `onError`
    // re-collides with the DOM handler.
    const asProp: NonNullable<FileUploadProps['onError']> =
      typedRejectionHandler
    const inObject: FileUploadProps = {
      onSelect: () => {},
      onError: typedRejectionHandler
    }

    expect(typeof asProp).toBe('function')
    expect(inObject.onError).toBe(typedRejectionHandler)
  })

  it('runs the documented discriminant guard at runtime', async () => {
    const seen: string[] = []
    const { container } = render(
      <FileUpload
        accept=".pem"
        onSelect={jest.fn()}
        onError={(failure) => {
          // The guard the docs prescribe. Contextually typed as the error union
          // and nothing else, so `.kind` resolves without a cast.
          if ('kind' in failure) seen.push(failure.kind)
        }}
      />
    )

    pick(container, fakeFile('notes.txt', 'text/plain', 10))

    await waitFor(() => expect(seen).toEqual(['wrong-type']))
  })

  it('does not leak the callback onto the native input as a DOM handler', () => {
    // `onError` is the component's contract, not the input's. If it stopped
    // being destructured it would ride `...rest` onto the file input and fire
    // on unrelated DOM error events.
    const { container } = render(
      <FileUpload onSelect={jest.fn()} onError={typedRejectionHandler} />
    )
    const input = container.querySelector('input[type="file"]')!
    expect(input).not.toHaveAttribute('onerror')
  })
})

describe('FileUpload silence edge cases', () => {
  it('treats an empty-string label as silence, not as an empty alert', async () => {
    // A formatter that has no message for a kind returns ''. Rendering an
    // empty role="alert" would announce nothing while still claiming a live
    // region, and would point aria-describedby at blank text.
    const onError = jest.fn()
    const { container } = render(
      <FileUpload
        accept=".pem"
        onSelect={jest.fn()}
        onError={onError}
        labels={{ error: () => '' }}
      />
    )

    pick(container, fakeFile('notes.txt', 'text/plain', 10))

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(container.querySelector('input[type="file"]')).not.toHaveAttribute(
      'aria-describedby'
    )
  })

  it('keeps a FormControl-injected describedby when the label is silent', async () => {
    // Silencing the primitive's own copy must not take the form's description
    // and message associations with it.
    const onError = jest.fn()
    const { container } = render(
      <FileUpload
        accept=".pem"
        aria-describedby="cert-hint"
        onSelect={jest.fn()}
        onError={onError}
        labels={{ error: () => null }}
      />
    )

    pick(container, fakeFile('notes.txt', 'text/plain', 10))

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
    expect(container.querySelector('input[type="file"]')).toHaveAttribute(
      'aria-describedby',
      'cert-hint'
    )
  })
})
