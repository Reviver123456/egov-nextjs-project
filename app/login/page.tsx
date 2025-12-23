
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [loading, setLoading] = useState(false)

  async function login() {
    setLoading(true)
    await fetch('/api/egov', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: params.get('appId'),
        mToken: params.get('mToken'),
      }),
    })
    router.replace('/home')
  }

  return <button onClick={login} disabled={loading}>Login</button>
}
