import { useEffect, useState } from 'react'

export default function Home() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function run() {
      setLoading(true)
      setError(null)
      try {
        let appId = null
        let mToken = null

        // ✅ ดึงจาก SDK ถ้ามี
        if (
          window.czpSdk &&
          typeof window.czpSdk.getappId === 'function' &&
          typeof window.czpSdk.getmToken === 'function'
        ) {
          appId = window.czpSdk.getappId()
          mToken = window.czpSdk.getmToken()
          console.log('[CZP SDK] appId:', appId, 'mToken:', mToken)
        }

        // ✅ ถ้าไม่มี SDK → fallback จาก URL
        if (!appId || !mToken) {
          const urlParams = new URLSearchParams(window.location.search)
          appId = urlParams.get('appId')
          mToken = urlParams.get('mToken')
          console.log('[URL fallback] appId:', appId, 'mToken:', mToken)
        }

        if (!appId || !mToken)
          throw new Error('Missing appId or mToken (SDK or URL)')

        const res = await fetch('/api/egov', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appId, mToken })
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || JSON.stringify(data))
        setResult(data)
      } catch (err) {
        setError(String(err))
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  return (
    <div style={{ maxWidth: 900, margin: 'auto', padding: 20 }}>
      <h1>DGA Demo</h1>

      <h2>Status</h2>
      {loading && <p>Processing... (calling deproc)</p>}
      {error && <pre style={{ color: 'red' }}>{error}</pre>}

      <h2>Saved result</h2>
      <pre>{result ? JSON.stringify(result, null, 2) : 'No result yet'}</pre>
    </div>
  )
}
