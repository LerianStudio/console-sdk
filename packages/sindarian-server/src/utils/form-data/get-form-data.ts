export function getFormData(form: FormData) {
  const data: Record<string, any> = {}
  form.forEach((value, key) => {
    data[key] = value
  })
  return data
}
