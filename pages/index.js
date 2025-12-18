import { useEffect, useState } from 'react'

function safeJsonParse(text) {
  if (!text || !text.trim()) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export default function Home() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [appId, setAppId] = useState(null)
  const [mToken, setMToken] = useState(null)

  useEffect(() => {
    async function run() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams(window.location.search)
        const _appId = params.get('appId')
        const _mToken = params.get('mToken')

        setAppId(_appId)
        setMToken(_mToken)

        if (!_appId || !_mToken) {
          throw new Error('Missing appId or mToken in URLSearchParams')
        }

        const res = await fetch('/api/egov', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appId: _appId, mToken: _mToken })
        })

        // ✅ กัน JSON ว่าง/ไม่ใช่ JSON
        const text = await res.text()
        const data = safeJsonParse(text)

        if (!res.ok) {
          // ถ้า backend ส่ง JSON จะอ่านได้ / ถ้าไม่ส่งจะโชว์ text ดิบ
          throw new Error(
            (data && (data.error || JSON.stringify(data))) ||
              text ||
              `HTTP ${res.status}`
          )
        }

        // ✅ กรณี ok แต่ body ว่าง
        if (!data) {
          throw new Error('Backend returned empty body (not JSON).')
        }

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

      <h2>URL Parameters</h2>
      <pre>{JSON.stringify({ appId, mToken }, null, 2)}</pre>

      <h2>Status</h2>
      {loading && <p>Processing... (validate → deproc)</p>}
      {error && <pre style={{ color: 'red' }}>{error}</pre>}

      <h2>Token (From Backend)</h2>
      <pre>{result?.token || 'No token yet'}</pre>

      <h2>Full Result</h2>
      <pre>{result ? JSON.stringify(result, null, 2) : 'No result yet'}</pre>
    </div>
  )
}
