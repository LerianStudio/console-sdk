import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { FileUploadField } from '.'

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

describe('FileUploadField', () => {
  it('submits the file text as the form value and shows the chip', async () => {
    const onSubmit = jest.fn()
    const { container } = render(<Harness onSubmit={onSubmit} />)

    expect(screen.getByText('Certificate')).toBeInTheDocument()
    expect(screen.getByText('PEM only')).toBeInTheDocument()

    await pick(
      container,
      new File(['PEM BODY'], 'cert.pem', { type: 'text/plain' })
    )

    expect(await screen.findByText('cert.pem')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Submit'))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ cert: 'PEM BODY' })
    )
  })

  it('clears the form value on a rejected pick so it cannot pass validation', async () => {
    const onSubmit = jest.fn()
    const { container } = render(<Harness onSubmit={onSubmit} />)

    await pick(container, new File(['PEM'], 'cert.pem', { type: 'text/plain' }))
    expect(await screen.findByText('cert.pem')).toBeInTheDocument()

    await pick(container, new File(['x'], 'notes.txt', { type: 'text/plain' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'File type not allowed'
    )
    fireEvent.click(screen.getByText('Submit'))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ cert: '' }))
  })

  it('drops the chip when the form value is reset externally', async () => {
    let form!: UseFormReturn<{ cert: string }>
    const { container } = render(<Harness formRef={(f) => (form = f)} />)

    await pick(container, new File(['PEM'], 'cert.pem', { type: 'text/plain' }))
    expect(await screen.findByText('cert.pem')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Submit'))
    await waitFor(() => expect(form.getValues('cert')).toBe('PEM'))

    act(() => form.reset({ cert: '' }))

    await waitFor(() =>
      expect(screen.queryByText('cert.pem')).not.toBeInTheDocument()
    )
    expect(screen.getByText('Choose a file')).toBeInTheDocument()
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
