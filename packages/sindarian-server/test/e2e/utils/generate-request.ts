import { NextRequest } from 'next/server'

export function generateRequest(
  method: string,
  path: string,
  body?: any,
  params?: any
) {
  return [
    new NextRequest(path, {
      method,
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    }),
    {
      params: new Promise((resolve) => {
        resolve(params)
      })
    }
  ]
}
