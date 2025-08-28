import 'reflect-metadata'
import { NextRequest } from 'next/server'
import { app } from './app/app'
;(async () => {
  try {
    const request = new NextRequest('http://localhost:3000/api/v1/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Test' })
    })

    const params = {
      params: new Promise((resolve) => {
        resolve({
          // id: '1'
        })
      })
    }

    const response = await app.handler(request, params)

    if (!response.ok) {
      console.error('Request failed with status:', response.status)
      const errorText = await response.text()
      console.error('Error:', errorText)
      process.exit(1)
    }

    const body = await response.json()
    console.log('Response: ', body)
    process.exit(0)
  } catch (error) {
    console.error('Error occurred:', error)
    process.exit(1)
  }
})()
