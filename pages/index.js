import { useEffect, useRef, useState } from 'react'

function safeJsonParse(text) {
  if (!text || !text.trim()) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function mask(value, head = 6, tail = 4) {
  if (!value) return '-'
  if (value.length <= head + tail) return value
  return `${value.slice(0, head)}...${value.slice(-tail)}`
}

function Field({ label, value }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, padding: '10px 0' }}>
      <div style={{ color: '#6b7280', fontSize: 13 }}>{label}</div>
      <div style={{ fontWeight: 600, color: '#111827', wordBreak: 'break-word' }}>
        {value ?? '-'}
      </div>
    </div>
  )
}

function Card({ title, children, right }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        padding: 16,
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        marginTop: 14
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 16, color: '#111827' }}>{title}</h2>
        {right}
      </div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  )
}

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [appId, setAppId] = useState(null)
  const [mToken, setMToken] = useState(null)

  const [backendToken, setBackendToken] = useState(null)
  const [saved, setSaved] = useState(null)

  // debug
  const [rawOpen, setRawOpen] = useState(false)
  const [debug, setDebug] = useState(null)

  // กันยิงซ้ำใน dev (React StrictMode)
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    const controller = new AbortController()

    async function run() {
      setLoading(true)
      setError(null)
      setBackendToken(null)
      setSaved(null)
      setDebug(null)

      try {
        const params = new URLSearchParams(window.location.search)
        const _appId = params.get('appId')
        const _mToken = params.get('mToken')

        setAppId(_appId)
        setMToken(_mToken)

        if (!_appId || !_mToken) {
          throw new Error('Missing appId or mToken in URL')
        }

        const res = await fetch('/api/egov', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appId: _appId, mToken: _mToken }),
          signal: controller.signal
        })

        const contentType = res.headers.get('content-type') || ''
        const text = await res.text().catch(() => '')
        const json = safeJsonParse(text)

        setDebug({
          ok: res.ok,
          status: res.status,
          contentType,
          rawText: (text || '').slice(0, 6000)
        })

        if (!res.ok) {
          // รองรับหลายรูปแบบ error จาก backend
          const msg =
            json?.error ||
            json?.message ||
            json?.step ||
            text ||
            `Request failed: ${res.status}`
          throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
        }

        // ถ้า backend คืน json ไม่ได้จริง ๆ ก็ใช้ text
        const payload = json ?? { raw: text }

        setBackendToken(payload?.token || null)
        setSaved(payload?.saved || null)
      } catch (err) {
        if (err?.name === 'AbortError') return
        setError(String(err?.message || err))
      } finally {
        setLoading(false)
      }
    }

    run()
    return () => controller.abort()
  }, [])

  const statusBadge = (() => {
    if (loading) return { text: 'Processing… (validate → deproc)', bg: '#fef3c7', color: '#92400e' }
    if (error) return { text: 'Failed', bg: '#fee2e2', color: '#991b1b' }
    if (backendToken || saved) return { text: 'Success', bg: '#dcfce7', color: '#166534' }
    return { text: 'Idle', bg: '#e5e7eb', color: '#374151' }
  })()

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: 20, background: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, color: '#111827' }}>DGA Demo</h1>
          <p style={{ margin: '6px 0 0', color: '#6b7280' }}>
            แสดงผลแบบหัวข้อ (ไม่โชว์ JSON ยาว) + รองรับ response ที่ไม่ใช่ JSON
          </p>
        </div>

        <div style={{ padding: '8px 12px', borderRadius: 999, background: statusBadge.bg, color: statusBadge.color, fontWeight: 700 }}>
          {statusBadge.text}
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 12,
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            whiteSpace: 'pre-wrap',
            fontWeight: 600
          }}
        >
          {error}
        </div>
      )}

      <Card title="URL Parameters">
        <Field label="appId" value={appId ? mask(appId, 10, 6) : '-'} />
        <Field label="mToken" value={mToken ? mask(mToken, 10, 6) : '-'} />
      </Card>

      <Card title="Token (From Backend)">
        <Field label="token" value={backendToken ? mask(backendToken, 14, 8) : '-'} />
      </Card>

      <Card title="Citizen Data (Saved)">
        {!saved ? (
          <div style={{ color: '#6b7280' }}>ยังไม่มีข้อมูล (รอ backend ตอบ หรือเกิด error)</div>
        ) : (
          <>
            <Field label="userId" value={saved.userId ?? '-'} />
            <Field label="citizenId" value={saved.citizenId ?? '-'} />
            <Field label="firstName" value={saved.firstName ?? '-'} />
            <Field label="lastName" value={saved.lastName ?? '-'} />
            <Field label="dateOfBirth" value={saved.dateOfBirthString ?? '-'} />
            <Field label="mobile" value={saved.mobile ?? '-'} />
            <Field label="email" value={saved.email ?? '-'} />
            <Field label="notification" value={saved.notification ?? '-'} />
          </>
        )}
      </Card>

      <Card
        title="Debug (Raw Response)"
        right={
          <button
            onClick={() => setRawOpen(v => !v)}
            style={{
              border: '1px solid #e5e7eb',
              background: '#fff',
              borderRadius: 10,
              padding: '8px 10px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {rawOpen ? 'Hide' : 'Show'}
          </button>
        }
      >
        {!debug ? (
          <div style={{ color: '#6b7280' }}>No debug yet</div>
        ) : (
          <>
            <Field label="status" value={String(debug.status)} />
            <Field label="content-type" value={debug.contentType || '-'} />
            {rawOpen && (
              <pre
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 12,
                  background: '#0b1020',
                  color: '#e5e7eb',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {debug.rawText || ''}
              </pre>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
