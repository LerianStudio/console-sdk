import { getStorage } from './get-storage'
import isEmpty from 'lodash/isEmpty.js'
import isNil from 'lodash/isNil.js'

export function getStorageObject(key: string, defaultValue: any) {
  try {
    const dataString = getStorage(key, defaultValue)
    const isNilOrEmpty = isNil(dataString) || isEmpty(dataString)

    return isNilOrEmpty ? {} : JSON.parse(dataString)
  } catch (error) {
    // Only log errors when not in test environment
    if (process.env.NODE_ENV !== 'test') {
      console.error(error)
    }
    return defaultValue
  }
}
