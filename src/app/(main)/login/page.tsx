import React, { Suspense } from 'react'
import Login from './Login'

export default function page() {
  return (
    <div>
      <Suspense>
        <Login />
      </Suspense>
    </div>
  )
}
