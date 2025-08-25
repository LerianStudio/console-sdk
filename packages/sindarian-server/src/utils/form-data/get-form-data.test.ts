import { getFormData } from './get-form-data'

describe('getFormData', () => {
  it('should convert FormData to object with simple key-value pairs', () => {
    const formData = new FormData()
    formData.append('name', 'John')
    formData.append('email', 'john@example.com')
    formData.append('age', '30')

    const result = getFormData(formData)

    expect(result).toEqual({
      name: 'John',
      email: 'john@example.com',
      age: '30'
    })
  })

  it('should handle empty FormData', () => {
    const formData = new FormData()

    const result = getFormData(formData)

    expect(result).toEqual({})
  })

  it('should handle FormData with File objects', () => {
    const formData = new FormData()
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })

    formData.append('document', file)
    formData.append('title', 'Test Document')

    const result = getFormData(formData)

    expect(result.document).toBe(file)
    expect(result.title).toBe('Test Document')
    expect(result.document instanceof File).toBe(true)
  })

  it('should handle FormData with Blob objects', () => {
    const formData = new FormData()
    const blob = new Blob(['blob content'], { type: 'text/plain' })

    formData.append('data', blob)
    formData.append('type', 'blob')

    const result = getFormData(formData)

    // Note: When appending Blob to FormData, it gets converted to File
    expect(result.data).toBeInstanceOf(File)
    expect(result.type).toBe('blob')
    expect(result.data instanceof Blob).toBe(true) // File extends Blob
  })

  it('should handle FormData with multiple values for the same key (last value wins)', () => {
    const formData = new FormData()
    formData.append('tags', 'tag1')
    formData.append('tags', 'tag2')
    formData.append('tags', 'tag3')

    const result = getFormData(formData)

    // FormData.forEach iterates in order, so the last value should be retained
    expect(result.tags).toBe('tag3')
  })

  it('should handle FormData with special characters in keys and values', () => {
    const formData = new FormData()
    formData.append('user[name]', 'John Doe')
    formData.append('user[email]', 'john+test@example.com')
    formData.append('settings.theme', 'dark')
    formData.append('array[]', 'item1')

    const result = getFormData(formData)

    expect(result).toEqual({
      'user[name]': 'John Doe',
      'user[email]': 'john+test@example.com',
      'settings.theme': 'dark',
      'array[]': 'item1'
    })
  })

  it('should handle FormData with numeric string values', () => {
    const formData = new FormData()
    formData.append('count', '42')
    formData.append('price', '19.99')
    formData.append('negative', '-10')

    const result = getFormData(formData)

    expect(result).toEqual({
      count: '42',
      price: '19.99',
      negative: '-10'
    })
  })

  it('should handle FormData with boolean string values', () => {
    const formData = new FormData()
    formData.append('active', 'true')
    formData.append('disabled', 'false')
    formData.append('hidden', 'on')

    const result = getFormData(formData)

    expect(result).toEqual({
      active: 'true',
      disabled: 'false',
      hidden: 'on'
    })
  })

  it('should handle FormData with empty string values', () => {
    const formData = new FormData()
    formData.append('empty', '')
    formData.append('name', 'John')
    formData.append('blank', '')

    const result = getFormData(formData)

    expect(result).toEqual({
      empty: '',
      name: 'John',
      blank: ''
    })
  })

  it('should handle FormData with whitespace values', () => {
    const formData = new FormData()
    formData.append('spaces', '   ')
    formData.append('tabs', '\t\t')
    formData.append('newlines', '\n\n')
    formData.append('mixed', ' \t\n ')

    const result = getFormData(formData)

    expect(result).toEqual({
      spaces: '   ',
      tabs: '\t\t',
      newlines: '\n\n',
      mixed: ' \t\n '
    })
  })

  it('should handle FormData with Unicode characters', () => {
    const formData = new FormData()
    formData.append('emoji', '🚀')
    formData.append('chinese', '你好')
    formData.append('arabic', 'مرحبا')
    formData.append('russian', 'Привет')

    const result = getFormData(formData)

    expect(result).toEqual({
      emoji: '🚀',
      chinese: '你好',
      arabic: 'مرحبا',
      russian: 'Привет'
    })
  })

  it('should handle mixed content types in FormData', () => {
    const formData = new FormData()
    const file = new File(['file content'], 'document.pdf', {
      type: 'application/pdf'
    })
    const blob = new Blob(['blob data'], { type: 'application/octet-stream' })

    formData.append('title', 'Mixed Content')
    formData.append('document', file)
    formData.append('data', blob)
    formData.append('count', '5')
    formData.append('active', 'true')

    const result = getFormData(formData)

    expect(result.title).toBe('Mixed Content')
    expect(result.document).toBe(file)
    expect(result.data).toBeInstanceOf(File) // Blob becomes File in FormData
    expect(result.count).toBe('5')
    expect(result.active).toBe('true')
  })

  it('should handle large FormData', () => {
    const formData = new FormData()

    // Add many fields
    for (let i = 0; i < 100; i++) {
      formData.append(`field${i}`, `value${i}`)
    }

    const result = getFormData(formData)

    expect(Object.keys(result)).toHaveLength(100)
    expect(result.field0).toBe('value0')
    expect(result.field50).toBe('value50')
    expect(result.field99).toBe('value99')
  })

  it('should preserve object reference equality for File and Blob values', () => {
    const formData = new FormData()
    const originalFile = new File(['content'], 'test.txt')
    const originalBlob = new Blob(['data'])

    formData.append('file', originalFile)
    formData.append('blob', originalBlob)

    const result = getFormData(formData)

    expect(result.file).toBe(originalFile) // Same reference for File
    expect(result.blob).toBeInstanceOf(File) // Blob becomes File in FormData
    expect(result.blob instanceof Blob).toBe(true) // But File extends Blob
  })
})
