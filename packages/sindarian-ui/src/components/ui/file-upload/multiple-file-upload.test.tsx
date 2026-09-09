import '@testing-library/jest-dom'
import { useState } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  MultipleFileUpload,
  humanizeSize,
  type FileUploadResult,
  type MultipleFileUploadError,
  type MultipleFileUploadProps
} from '.'

/** Construct a File with a controlled `.size` for the byte-cap path. */
function fakeFile(name: string, type: string, size: number): File {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

function pdf(name: string, size = 10): File {
  return fakeFile(name, 'application/pdf', size)
}

/** Pick a batch through the native input, the way a real multi-select does. */
function pick(container: HTMLElement, files: File[]) {
  fireEvent.change(container.querySelector('input[type="file"]')!, {
    target: { files }
  })
}

function input(container: HTMLElement): HTMLInputElement {
  return container.querySelector<HTMLInputElement>('input[type="file"]')!
}

function zone(container: HTMLElement): HTMLElement {
  return input(container).parentElement as HTMLElement
}

/**
 * A host that owns the value, which is the only way to exercise ACCUMULATION:
 * the second pick has to see what the first one produced.
 */
function Harness({
  onChange,
  ...props
}: Partial<MultipleFileUploadProps> & {
  onChange?: (values: FileUploadResult[]) => void
}) {
  const [value, setValue] = useState<FileUploadResult[]>([])
  return (
    <MultipleFileUpload
      readAs="none"
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
    />
  )
}

const names = (values: FileUploadResult[]) => values.map((v) => v.file.name)

describe('MultipleFileUpload accessibility', () => {
  it('renders a focusable, labelable, sr-only MULTIPLE file input as the control', () => {
    const { container } = render(
      <MultipleFileUpload
        id="evidence"
        accept=".pdf"
        onValueChange={jest.fn()}
      />
    )

    const el = input(container)
    expect(el).toHaveAttribute('id', 'evidence')
    expect(el).toHaveAttribute('accept', '.pdf')
    expect(el).toHaveAttribute('multiple')
    expect(el).toHaveClass('sr-only')
    // Same contract as the single-file sibling: the input IS the accessible
    // control, never hidden, never double-named by a wrapping <label>, and,
    // while enabled as it is here, never pulled from the tab order. The capped
    // state is the exception and is covered by the cap tests.
    expect(el).not.toHaveAttribute('aria-hidden')
    expect(el).not.toHaveAttribute('tabindex')
    expect(container.querySelector('label')).toBeNull()
  })

  it('spreads the injected ARIA onto the input', () => {
    const { container } = render(
      <MultipleFileUpload
        id="evidence"
        aria-required
        aria-describedby="evidence-desc"
        aria-label="Supporting evidence"
        onValueChange={jest.fn()}
      />
    )

    const el = input(container)
    expect(el).toHaveAttribute('aria-required', 'true')
    expect(el).toHaveAttribute('aria-describedby', 'evidence-desc')
    expect(el).toHaveAttribute('aria-label', 'Supporting evidence')
  })

  it('marks the zone and the input invalid when aria-invalid is set', () => {
    const { container } = render(
      <MultipleFileUpload aria-invalid onValueChange={jest.fn()} />
    )

    expect(container.querySelectorAll('[aria-invalid="true"]')).toHaveLength(2)
  })

  /**
   * A disabled zone must not accept the files, which is obvious, and must ALSO
   * cancel the browser's own action for them, which is not: an uncancelled
   * file drop navigates the window to the file and takes every unsaved edit on
   * the page with it. `fireEvent` returns false exactly when a handler called
   * `preventDefault`, so this measures the cancellation and not a proxy.
   */
  it('cancels the browser drop on a disabled zone and still refuses the files', () => {
    const onValueChange = jest.fn()
    const { container } = render(
      <MultipleFileUpload disabled onValueChange={onValueChange} />
    )

    expect(
      fireEvent.dragOver(zone(container), { dataTransfer: { dropEffect: '' } })
    ).toBe(false)
    expect(
      fireEvent.drop(zone(container), {
        dataTransfer: { files: [pdf('dropped.pdf')] }
      })
    ).toBe(false)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('disables the native input when disabled', () => {
    const { container } = render(
      <MultipleFileUpload disabled onValueChange={jest.fn()} />
    )

    expect(input(container)).toBeDisabled()
  })

  it('gives every remove control an accessible name that identifies its file', () => {
    render(
      <MultipleFileUpload
        value={[
          { file: pdf('contract.pdf'), text: '' },
          { file: pdf('receipt.pdf'), text: '' }
        ]}
        onValueChange={jest.fn()}
      />
    )

    // A bare "Remove file" on every row leaves a screen-reader user with a
    // list of identical controls and no way to tell which one to activate.
    expect(
      screen.getByRole('button', { name: 'Remove contract.pdf' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Remove receipt.pdf' })
    ).toBeInTheDocument()
  })

  it('renders each selected file with its humanized size', () => {
    render(
      <MultipleFileUpload
        value={[{ file: pdf('contract.pdf', 2048), text: '' }]}
        onValueChange={jest.fn()}
      />
    )

    expect(screen.getByText('contract.pdf')).toBeInTheDocument()
    expect(screen.getByText(humanizeSize(2048))).toBeInTheDocument()
  })
})

describe('MultipleFileUpload accumulation', () => {
  it('ACCUMULATES across two separate picks instead of replacing the selection', () => {
    const onChange = jest.fn()
    const { container } = render(<Harness onChange={onChange} />)

    pick(container, [pdf('first.pdf')])
    expect(names(onChange.mock.calls[0][0])).toEqual(['first.pdf'])

    pick(container, [pdf('second.pdf')])
    expect(names(onChange.mock.calls[1][0])).toEqual([
      'first.pdf',
      'second.pdf'
    ])
  })

  it('appends a whole batch in pick order', () => {
    const onChange = jest.fn()
    const { container } = render(<Harness onChange={onChange} />)

    pick(container, [pdf('a.pdf'), pdf('b.pdf'), pdf('c.pdf')])

    expect(names(onChange.mock.calls[0][0])).toEqual([
      'a.pdf',
      'b.pdf',
      'c.pdf'
    ])
  })

  it('keeps accumulating after a drop', () => {
    const onChange = jest.fn()
    const { container } = render(<Harness onChange={onChange} />)

    pick(container, [pdf('picked.pdf')])
    fireEvent.drop(zone(container), {
      dataTransfer: { files: [pdf('dropped.pdf')] }
    })

    expect(names(onChange.mock.calls[1][0])).toEqual([
      'picked.pdf',
      'dropped.pdf'
    ])
  })

  it('releases the native input after a batch, so the same file can be re-picked', () => {
    const { container } = render(<Harness />)
    const el = input(container)
    const setValue = jest.fn()
    Object.defineProperty(el, 'value', {
      configurable: true,
      get: () => '',
      set: setValue
    })

    pick(container, [pdf('same.pdf')])

    expect(setValue).toHaveBeenCalledWith('')
  })
})

describe('MultipleFileUpload cap', () => {
  it('refuses the overflow but KEEPS the files that fit', () => {
    const onChange = jest.fn()
    const onError = jest.fn()
    const { container } = render(
      <Harness maxFiles={2} onChange={onChange} onError={onError} />
    )

    pick(container, [pdf('a.pdf'), pdf('b.pdf'), pdf('c.pdf')])

    // The two that fit are selected; only the third is refused.
    expect(names(onChange.mock.calls[0][0])).toEqual(['a.pdf', 'b.pdf'])
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0].kind).toBe('too-many')
  })

  it('names the FIRST file that did not fit', () => {
    const onError = jest.fn()
    const { container } = render(<Harness maxFiles={2} onError={onError} />)

    pick(container, [pdf('a.pdf'), pdf('b.pdf'), pdf('c.pdf'), pdf('d.pdf')])

    const failure = onError.mock.calls[0][0] as MultipleFileUploadError
    expect(failure.kind).toBe('too-many')
    expect(failure.file.name).toBe('c.pdf')
    if (failure.kind === 'too-many') expect(failure.maxFiles).toBe(2)
  })

  it('counts room against what is ALREADY selected, not against the batch', () => {
    const onChange = jest.fn()
    const onError = jest.fn()
    const { container } = render(
      <Harness maxFiles={2} onChange={onChange} onError={onError} />
    )

    pick(container, [pdf('a.pdf')])
    pick(container, [pdf('b.pdf'), pdf('c.pdf')])

    expect(names(onChange.mock.calls[1][0])).toEqual(['a.pdf', 'b.pdf'])
    expect(onError.mock.calls[0][0].file.name).toBe('c.pdf')
  })

  it('validates before the cap, so a refused file cannot cost a good one its slot', () => {
    const onChange = jest.fn()
    const onError = jest.fn()
    const { container } = render(
      <Harness
        maxFiles={1}
        maxSizeBytes={1024}
        onChange={onChange}
        onError={onError}
      />
    )

    pick(container, [
      fakeFile('big.pdf', 'application/pdf', 4096),
      pdf('good.pdf'),
      pdf('spare.pdf')
    ])

    // One slot left. The oversized file was never eligible for it, so it must
    // not be the reason the good file is turned away.
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(names(onChange.mock.calls[0][0])).toEqual(['good.pdf'])

    expect(onError.mock.calls.map((call) => call[0].kind).sort()).toEqual([
      'too-large',
      'too-many'
    ])
    const tooMany = onError.mock.calls
      .map((call) => call[0])
      .filter((failure) => failure.kind === 'too-many')
    // `too-many` names a file a slot would genuinely have taken, never one
    // already refused for its size: blaming the cap for that is a lie.
    expect(tooMany).toHaveLength(1)
    expect(tooMany[0].file.name).toBe('spare.pdf')
  })

  it('refuses everything once the cap is already reached', () => {
    const onChange = jest.fn()
    const onError = jest.fn()
    const { container } = render(
      <Harness maxFiles={1} onChange={onChange} onError={onError} />
    )

    pick(container, [pdf('a.pdf')])
    fireEvent.drop(zone(container), { dataTransfer: { files: [pdf('b.pdf')] } })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0].file.name).toBe('b.pdf')
  })

  it('stops offering the picker once the cap is reached', () => {
    const { container } = render(
      <MultipleFileUpload
        maxFiles={1}
        value={[{ file: pdf('a.pdf'), text: '' }]}
        onValueChange={jest.fn()}
      />
    )

    // Native `disabled`, not `aria-disabled`: the picker's only job is to open
    // the file dialog, and `disabled` is what both closes it and states the
    // unavailability. The tab-order cost that carries, and the escape hatch
    // that pays for it, are pinned by the next test.
    expect(input(container)).toBeDisabled()
  })

  it('keeps the way back under the cap reachable from the keyboard', () => {
    const { container } = render(
      <MultipleFileUpload
        maxFiles={1}
        value={[{ file: pdf('a.pdf'), text: '' }]}
        onValueChange={jest.fn()}
      />
    )

    // The native `disabled` attribute DOES take the picker out of the tab
    // order, so the cap costs this input its focus target. That is only
    // acceptable because the escape hatch stays reachable: the remove controls
    // answer to `disabled` alone and never to the cap, so a keyboard user can
    // always get back under it. Without that, the cap would be a dead end.
    const picker = input(container)
    expect(picker).toBeDisabled()
    picker.focus()
    expect(picker).not.toHaveFocus()

    const remove = screen.getByRole('button', { name: 'Remove a.pdf' })
    expect(remove).toBeEnabled()
    remove.focus()
    expect(remove).toHaveFocus()
  })

  it('accepts an unbounded selection when maxFiles is omitted', () => {
    const onChange = jest.fn()
    const onError = jest.fn()
    const { container } = render(
      <Harness onChange={onChange} onError={onError} />
    )

    pick(
      container,
      Array.from({ length: 20 }, (_, i) => pdf(`f${i}.pdf`))
    )

    expect(onChange.mock.calls[0][0]).toHaveLength(20)
    expect(onError).not.toHaveBeenCalled()
  })
})

describe('MultipleFileUpload per-file validation', () => {
  it('one rejected file does NOT discard the accepted ones in the same batch', () => {
    const onChange = jest.fn()
    const onError = jest.fn()
    const { container } = render(
      <Harness accept=".pdf" onChange={onChange} onError={onError} />
    )

    pick(container, [
      pdf('good1.pdf'),
      fakeFile('notes.txt', 'text/plain', 10),
      pdf('good2.pdf')
    ])

    // The batch continues past the rejection instead of aborting.
    expect(names(onChange.mock.calls[0][0])).toEqual(['good1.pdf', 'good2.pdf'])
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0].kind).toBe('wrong-type')
    expect(onError.mock.calls[0][0].file.name).toBe('notes.txt')
  })

  it('reports every rejection in a batch, not just the first', () => {
    const onError = jest.fn()
    const { container } = render(
      <Harness accept=".pdf" maxSizeBytes={1024} onError={onError} />
    )

    pick(container, [
      fakeFile('notes.txt', 'text/plain', 10),
      pdf('huge.pdf', 4096)
    ])

    expect(onError.mock.calls.map((c) => c[0].kind)).toEqual([
      'wrong-type',
      'too-large'
    ])
  })

  it('emits no value change when every file in the batch is refused', () => {
    const onChange = jest.fn()
    const { container } = render(<Harness accept=".pdf" onChange={onChange} />)

    pick(container, [fakeFile('notes.txt', 'text/plain', 10)])

    expect(onChange).not.toHaveBeenCalled()
  })

  it('announces the refusals through a single role="alert"', () => {
    const { container } = render(<Harness accept=".pdf" maxSizeBytes={1024} />)

    pick(container, [
      fakeFile('notes.txt', 'text/plain', 10),
      pdf('huge.pdf', 4096)
    ])

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('File type not allowed (expected .pdf).')
    expect(alert).toHaveTextContent('File is too large (max 1.0 KB).')
  })

  it('retires a stale refusal once a later batch is fully accepted', () => {
    const { container } = render(<Harness accept=".pdf" />)

    pick(container, [fakeFile('notes.txt', 'text/plain', 10)])
    expect(screen.getByRole('alert')).toBeInTheDocument()

    pick(container, [pdf('ok.pdf')])
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('reads as invalid while a refusal stands', () => {
    const { container } = render(<Harness accept=".pdf" />)

    pick(container, [fakeFile('notes.txt', 'text/plain', 10)])

    expect(input(container)).toHaveAttribute('aria-invalid', 'true')
    expect(zone(container)).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('MultipleFileUpload removal', () => {
  it('removes BY INDEX, so duplicate filenames stay distinguishable', () => {
    const onValueChange = jest.fn()
    const first = pdf('receipt.pdf')
    const second = pdf('receipt.pdf')
    render(
      <MultipleFileUpload
        value={[
          { file: first, text: '' },
          { file: second, text: '' }
        ]}
        onValueChange={onValueChange}
      />
    )

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Remove receipt.pdf' })[0]
    )

    const next = onValueChange.mock.calls[0][0] as FileUploadResult[]
    expect(next).toHaveLength(1)
    // Identity, not name: a name-keyed remove would be ambiguous here.
    expect(next[0].file).toBe(second)
  })

  it('removes the middle entry without disturbing its neighbours', () => {
    const onValueChange = jest.fn()
    render(
      <MultipleFileUpload
        value={[
          { file: pdf('a.pdf'), text: '' },
          { file: pdf('b.pdf'), text: '' },
          { file: pdf('c.pdf'), text: '' }
        ]}
        onValueChange={onValueChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remove b.pdf' }))

    expect(names(onValueChange.mock.calls[0][0])).toEqual(['a.pdf', 'c.pdf'])
  })

  it('does not open the picker when a remove control is activated', () => {
    const { container } = render(
      <MultipleFileUpload
        value={[{ file: pdf('a.pdf'), text: '' }]}
        onValueChange={jest.fn()}
      />
    )
    const click = jest.spyOn(input(container), 'click')

    fireEvent.click(screen.getByRole('button', { name: 'Remove a.pdf' }))

    expect(click).not.toHaveBeenCalled()
  })

  it('disables the remove controls when the component is disabled', () => {
    render(
      <MultipleFileUpload
        disabled
        value={[{ file: pdf('a.pdf'), text: '' }]}
        onValueChange={jest.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Remove a.pdf' })).toBeDisabled()
  })
})

describe('MultipleFileUpload labels', () => {
  it('renders consumer copy for the affordance instead of the English default', () => {
    render(
      <MultipleFileUpload
        onValueChange={jest.fn()}
        labels={{ action: 'Escolha arquivos', hint: 'ou arraste e solte' }}
      />
    )

    expect(screen.getByText('Escolha arquivos')).toBeInTheDocument()
    expect(screen.getByText(/ou arraste e solte/)).toBeInTheDocument()
    expect(screen.queryByText('Choose files')).not.toBeInTheDocument()
  })

  it('names each remove control with consumer copy', () => {
    render(
      <MultipleFileUpload
        value={[{ file: pdf('recibo.pdf'), text: '' }]}
        onValueChange={jest.fn()}
        labels={{ remove: (file) => `Remover ${file.name}` }}
      />
    )

    expect(
      screen.getByRole('button', { name: 'Remover recibo.pdf' })
    ).toBeInTheDocument()
  })

  it('announces a refusal in consumer copy, with the payload to interpolate', () => {
    const { container } = render(
      <Harness
        maxFiles={1}
        labels={{
          error: (failure) =>
            failure.kind === 'too-many'
              ? `No máximo ${failure.maxFiles} arquivo(s): ${failure.file.name} ficou de fora.`
              : 'Recusado.'
        }}
      />
    )

    pick(container, [pdf('a.pdf'), pdf('b.pdf')])

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No máximo 1 arquivo(s): b.pdf ficou de fora.'
    )
  })

  it('stays silent when the host announces the refusal itself', () => {
    const onError = jest.fn()
    const { container } = render(
      <Harness accept=".pdf" onError={onError} labels={{ error: () => null }} />
    )

    pick(container, [fakeFile('notes.txt', 'text/plain', 10)])

    expect(onError).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    // Silence must not leave a dangling association pointing at nothing.
    expect(input(container)).not.toHaveAttribute('aria-describedby')
    // Still reads as invalid: the pick was refused, silence is only about copy.
    expect(input(container)).toHaveAttribute('aria-invalid', 'true')
  })

  it('keeps a FormControl-injected describedby when the label is silent', () => {
    const { container } = render(
      <Harness
        accept=".pdf"
        aria-describedby="evidence-hint"
        labels={{ error: () => null }}
      />
    )

    pick(container, [fakeFile('notes.txt', 'text/plain', 10)])

    expect(input(container)).toHaveAttribute(
      'aria-describedby',
      'evidence-hint'
    )
  })

  it('reports the cap in the zone once it is reached', () => {
    render(
      <MultipleFileUpload
        maxFiles={1}
        value={[{ file: pdf('a.pdf'), text: '' }]}
        onValueChange={jest.fn()}
        labels={{ full: (maxFiles) => `Limite de ${maxFiles} atingido.` }}
      />
    )

    expect(screen.getByText('Limite de 1 atingido.')).toBeInTheDocument()
  })
})

/**
 * A FileReader whose completion the test fires by hand, so batch ordering and
 * partial read failures can be driven deterministically.
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
    // A real reader that has been aborted reaches DONE and never fires load
    // or error afterwards, so drop the handlers or the fake would let an
    // aborted read still settle its batch.
    this.onload = null
    this.onerror = null
  }

  succeed(text: string) {
    this.result = text
    act(() => this.onload?.())
  }

  fail() {
    act(() => this.onerror?.())
  }
}

describe('MultipleFileUpload readAs', () => {
  const RealFileReader = global.FileReader

  beforeEach(() => {
    ControllableFileReader.instances = []
    global.FileReader = ControllableFileReader as unknown as typeof FileReader
  })

  afterEach(() => {
    global.FileReader = RealFileReader
  })

  it('hands every File over undecoded in "none" mode and never constructs a reader', () => {
    const onChange = jest.fn()
    const a = pdf('a.pdf', 20 * 1024 * 1024)
    const { container } = render(<Harness onChange={onChange} />)

    pick(container, [a])

    // Synchronous: nothing is read, so there is nothing to await.
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0][0].file).toBe(a)
    expect(ControllableFileReader.instances).toHaveLength(0)
  })

  it('decodes as UTF-8 by default and emits the batch in pick order', () => {
    const onChange = jest.fn()
    const { container } = render(
      <Harness readAs={undefined} onChange={onChange} />
    )

    pick(container, [
      new File(['A'], 'a.txt', { type: 'text/plain' }),
      new File(['B'], 'b.txt', { type: 'text/plain' })
    ])

    expect(ControllableFileReader.instances).toHaveLength(2)
    // Resolve them OUT of order; the emitted batch must still be a, b.
    ControllableFileReader.instances[1].succeed('B')
    ControllableFileReader.instances[0].succeed('A')

    // The EMITTED batch, not the rendered names: a DOM presence check passes
    // for either order, which is the one thing this test exists to pin. Each
    // file must also carry its own decoded text, not its neighbour's.
    expect(
      onChange.mock.calls[0][0].map((v: FileUploadResult) => [
        v.file.name,
        v.text
      ])
    ).toEqual([
      ['a.txt', 'A'],
      ['b.txt', 'B']
    ])
  })

  it('keeps the readable files when one file in the batch fails to read', () => {
    const onChange = jest.fn()
    const onError = jest.fn()
    const { container } = render(
      <Harness readAs={undefined} onChange={onChange} onError={onError} />
    )

    pick(container, [
      new File(['A'], 'a.txt', { type: 'text/plain' }),
      new File(['B'], 'b.txt', { type: 'text/plain' })
    ])

    ControllableFileReader.instances[0].fail()
    ControllableFileReader.instances[1].succeed('B')

    expect(names(onChange.mock.calls[0][0])).toEqual(['b.txt'])
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0].kind).toBe('read-failed')
  })

  it('abandons a pending read when the component unmounts', () => {
    const onChange = jest.fn()
    const { container, unmount } = render(
      <Harness readAs={undefined} onChange={onChange} />
    )

    pick(container, [
      new File(['A'], 'a.txt', { type: 'text/plain' }),
      new File(['B'], 'b.txt', { type: 'text/plain' })
    ])
    expect(ControllableFileReader.instances).toHaveLength(2)

    unmount()

    // The reads land after the component is gone. A commit here would call the
    // host's onValueChange for a component that no longer exists.
    ControllableFileReader.instances[0].succeed('A')
    ControllableFileReader.instances[1].succeed('B')

    expect(onChange).not.toHaveBeenCalled()
  })

  it('still validates size and type before reading anything', () => {
    const onChange = jest.fn()
    const onError = jest.fn()
    const { container } = render(
      <Harness
        readAs={undefined}
        accept=".txt"
        maxSizeBytes={1024}
        onChange={onChange}
        onError={onError}
      />
    )

    pick(container, [fakeFile('big.txt', 'text/plain', 4096)])

    expect(ControllableFileReader.instances).toHaveLength(0)
    expect(onChange).not.toHaveBeenCalled()
    expect(onError.mock.calls[0][0].kind).toBe('too-large')
  })
})

describe('MultipleFileUpload types', () => {
  it('accepts a concretely typed rejection handler at the type level', () => {
    // Fails to COMPILE if `onError` ever re-collides with React's DOM handler.
    const handler = (failure: MultipleFileUploadError): string => failure.kind
    const asProp: NonNullable<MultipleFileUploadProps['onError']> = handler
    const inObject: MultipleFileUploadProps = {
      onValueChange: () => {},
      onError: handler
    }

    expect(typeof asProp).toBe('function')
    expect(inObject.onError).toBe(handler)
  })
})

describe('MultipleFileUpload async batch overlap', () => {
  const RealFileReader = global.FileReader

  beforeEach(() => {
    ControllableFileReader.instances = []
    global.FileReader = ControllableFileReader as unknown as typeof FileReader
  })

  afterEach(() => {
    global.FileReader = RealFileReader
  })

  it('holds the cap when a second batch settles against a newer base', async () => {
    const onChange = jest.fn()
    const onError = jest.fn()
    const { container } = render(
      <Harness
        readAs={undefined}
        maxFiles={3}
        onChange={onChange}
        onError={onError}
      />
    )

    // Both batches measure their room against the SAME empty base, because
    // neither has committed yet. Four files must still not become a selection
    // of four under a cap of three.
    pick(container, [
      new File(['A'], 'a.txt', { type: 'text/plain' }),
      new File(['B'], 'b.txt', { type: 'text/plain' })
    ])
    pick(container, [
      new File(['C'], 'c.txt', { type: 'text/plain' }),
      new File(['D'], 'd.txt', { type: 'text/plain' })
    ])

    ControllableFileReader.instances.forEach((reader, index) =>
      reader.succeed(String.fromCharCode(65 + index))
    )

    await waitFor(() => {
      expect(names(onChange.mock.calls.at(-1)![0])).toEqual([
        'a.txt',
        'b.txt',
        'c.txt'
      ])
    })
    const tooMany = onError.mock.calls
      .map((call) => call[0])
      .filter((failure) => failure.kind === 'too-many')
    expect(tooMany).toHaveLength(1)
    expect(tooMany[0].file.name).toBe('d.txt')
  })

  it('does not lose the first batch when a second one is picked mid-read', async () => {
    const onChange = jest.fn()
    const { container } = render(
      <Harness readAs={undefined} onChange={onChange} />
    )

    pick(container, [new File(['A'], 'a.txt', { type: 'text/plain' })])
    pick(container, [new File(['B'], 'b.txt', { type: 'text/plain' })])

    // Both batches settle; accumulation means neither may overwrite the other.
    ControllableFileReader.instances[0].succeed('A')
    ControllableFileReader.instances[1].succeed('B')

    await waitFor(() => {
      expect(names(onChange.mock.calls.at(-1)![0])).toEqual(['a.txt', 'b.txt'])
    })
  })
})
