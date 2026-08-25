import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { FileUploadField } from '.'

/**
 * A React portal node, built by hand: `@types/react-dom` is not installed in
 * this workspace, so `createPortal` cannot be imported type-safely here.
 *
 * Shape-identical to the real thing, and verified as such: `Symbol.for` returns
 * the very symbol `createPortal` stamps, `isValidElement` is false for it, and
 * `Children.toArray` hands the same object straight back — which is precisely
 * what makes the recursion guard necessary.
 */
function portalLabel(
  text: string
): Exclude<ReactNode, null | undefined | boolean> {
  return {
    $$typeof: Symbol.for('react.portal'),
    key: null,
    children: text,
    containerInfo: document.body,
    implementation: null
  } as unknown as Exclude<ReactNode, null | undefined | boolean>
}

function Harness({
  onSubmit,
  error,
  formRef
}: {
  onSubmit?: (values: { cert: string }) => void
  error?: string
  formRef?: (form: UseFormReturn<{ cert: string }>) => void
}) {
  const form = useForm<{ cert: string }>({ defaultValues: { cert: '' } })
  formRef?.(form)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit?.(values))}>
        <FileUploadField
          control={form.control}
          name="cert"
          label="Certificate"
          description="PEM only"
          accept=".pem"
        />
        <button type="submit">Submit</button>
        <button
          type="button"
          onClick={() => form.setError('cert', { message: error })}
        >
          Fail
        </button>
      </form>
    </Form>
  )
}

/**
 * Pick a file. The FileReader read settles asynchronously and on a loaded
 * machine can take more than one macrotask tick, so callers must wait on the
 * outcome (`findBy*` / `waitFor`) — never a fixed delay, which turns into a
 * flaky race under parallel test workers.
 */
function pick(container: HTMLElement, file: File) {
  fireEvent.change(container.querySelector('input[type="file"]')!, {
    target: { files: [file] }
  })
}

describe('FileUploadField', () => {
  it('submits the file text as the form value and shows the chip', async () => {
    const onSubmit = jest.fn()
    const { container } = render(<Harness onSubmit={onSubmit} />)

    expect(screen.getByText('Certificate')).toBeInTheDocument()
    expect(screen.getByText('PEM only')).toBeInTheDocument()

    pick(container, new File(['PEM BODY'], 'cert.pem', { type: 'text/plain' }))

    expect(await screen.findByText('cert.pem')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Submit'))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ cert: 'PEM BODY' })
    )
  })

  it('clears the form value on a rejected pick so it cannot pass validation', async () => {
    const onSubmit = jest.fn()
    const { container } = render(<Harness onSubmit={onSubmit} />)

    pick(container, new File(['PEM'], 'cert.pem', { type: 'text/plain' }))
    expect(await screen.findByText('cert.pem')).toBeInTheDocument()

    pick(container, new File(['x'], 'notes.txt', { type: 'text/plain' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'File type not allowed'
    )
    fireEvent.click(screen.getByText('Submit'))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ cert: '' }))
  })

  it('drops the chip when the form value is reset externally', async () => {
    let form!: UseFormReturn<{ cert: string }>
    const { container } = render(<Harness formRef={(f) => (form = f)} />)

    pick(container, new File(['PEM'], 'cert.pem', { type: 'text/plain' }))
    expect(await screen.findByText('cert.pem')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Submit'))
    await waitFor(() => expect(form.getValues('cert')).toBe('PEM'))

    act(() => form.reset({ cert: '' }))

    await waitFor(() =>
      expect(screen.queryByText('cert.pem')).not.toBeInTheDocument()
    )
    expect(screen.getByText('Choose a file')).toBeInTheDocument()
  })

  it('names the file input via aria-label when there is no visible label', () => {
    function LabelFree() {
      const form = useForm<{ cert: string }>({ defaultValues: { cert: '' } })
      return (
        <Form {...form}>
          <FileUploadField
            control={form.control}
            name="cert"
            aria-label="A1 certificate"
          />
        </Form>
      )
    }
    render(<LabelFree />)

    expect(screen.getByLabelText('A1 certificate')).toHaveAttribute(
      'type',
      'file'
    )
  })

  describe.each([
    [null],
    [false],
    [''],
    ['   '],
    ['\t\n'],
    [[]],
    [<></>],
    [['', '  ']]
  ])('unrenderable label %p', (falsyLabel: unknown) => {
    it('renders no stray label element and still names the input via aria-label', () => {
      function FalsyLabel() {
        const form = useForm<{ cert: string }>({
          defaultValues: { cert: '' }
        })
        return (
          <Form {...form}>
            <FileUploadField
              control={form.control}
              name="cert"
              // @ts-expect-error null/false are compile errors; blank and
              // whitespace-only strings are only catchable at runtime. Every
              // one of them must still leave the input named.
              label={falsyLabel}
              aria-label="A1 certificate"
            />
          </Form>
        )
      }
      const { container } = render(<FalsyLabel />)

      expect(container.querySelector('label')).toBeNull()
      expect(screen.getByLabelText('A1 certificate')).toHaveAttribute(
        'type',
        'file'
      )
    })
  })

  it.each([
    ['empty', ''],
    ['whitespace-only', '   ']
  ])('drops a %s aria-label instead of naming the input ""', (_kind, blank) => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    function Nameless() {
      const form = useForm<{ cert: string }>({ defaultValues: { cert: '' } })
      return (
        <Form {...form}>
          {/* This COMPILES: a blank string cannot be excluded from `string`, so
              the union accepts it. The runtime guard is all that stands between
              this and a nameless control. */}
          <FileUploadField
            control={form.control}
            name="cert"
            label={blank}
            aria-label={blank}
          />
        </Form>
      )
    }
    const { container } = render(<Nameless />)

    expect(container.querySelector('input[type="file"]')).not.toHaveAttribute(
      'aria-label'
    )
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('FileUploadField "cert" has no accessible name')
    )
    spy.mockRestore()
  })

  it.each([
    ['without aria-label', undefined],
    ['with aria-label', 'A1 certificate']
  ])('renders a portal label %s without recursing forever', (_kind, aria) => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    function WithPortal() {
      const form = useForm<{ cert: string }>({ defaultValues: { cert: '' } })
      return (
        <Form {...form}>
          <FileUploadField
            control={form.control}
            name="cert"
            label={portalLabel('Certificate')}
            aria-label={aria}
          />
        </Form>
      )
    }

    // A portal is not an element and Children.toArray cannot decompose it, so
    // without a base case this overflows the stack instead of rendering.
    expect(() => render(<WithPortal />)).not.toThrow()
    const warned = spy.mock.calls.some((call) =>
      String(call[0]).includes('no accessible name')
    )
    spy.mockRestore()
    // A portal renders something, so it counts as a label — no warning.
    expect(warned).toBe(false)
  })

  it('warns when a blank-string collection label leaves the input nameless', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    function Nameless() {
      const form = useForm<{ cert: string }>({ defaultValues: { cert: '' } })
      return (
        <Form {...form}>
          {/* Compiles: an array of blank strings is a valid ReactNode, so the
              union accepts it with no aria-label. Only the guard catches it. */}
          <FileUploadField
            control={form.control}
            name="cert"
            label={['', '  ']}
          />
        </Form>
      )
    }
    const { container } = render(<Nameless />)

    expect(container.querySelector('label')).toBeNull()
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('FileUploadField "cert" has no accessible name')
    )
    spy.mockRestore()
  })

  it('marks the field touched on blur, so onBlur validation modes fire', async () => {
    let form!: UseFormReturn<{ cert: string }>
    const { container } = render(<Harness formRef={(f) => (form = f)} />)

    expect(form.formState.touchedFields.cert).toBeUndefined()

    fireEvent.blur(container.querySelector('input[type="file"]')!)

    await waitFor(() => expect(form.formState.touchedFields.cert).toBe(true))
  })

  it('renders the validation message through FormMessage', async () => {
    render(<Harness error="Certificate is required" />)

    fireEvent.click(screen.getByText('Fail'))

    expect(
      await screen.findByText('Certificate is required')
    ).toBeInTheDocument()
  })
})
