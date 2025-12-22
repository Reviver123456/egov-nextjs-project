'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

function safeJsonParse(text) {
  if (!text || !text.trim()) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function monospaceStyle() {
  return {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  }
}


function Icon({ type }) {
  const base = { width: 18, height: 18, display: 'inline-block' }

  if (type === 'ok')
    return (
      <svg style={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20 6L9 17l-5-5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )

  if (type === 'warn')
    return (
      <svg style={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )

  if (type === 'load')
    return (
      <svg style={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2v4m0 12v4m10-10h-4M6 12H2m16.95 6.95-2.83-2.83M9.88 9.88 7.05 7.05m11.9 0-2.83 2.83M9.88 14.12l-2.83 2.83"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    )

  if (type === 'user')
    return (
      <svg style={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20 21a8 8 0 1 0-16 0"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </svg>
    )

  if (type === 'mail')
    return (
      <svg style={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        <path
          d="M4 7l8 6 8-6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </svg>
    )

  if (type === 'phone')
    return (
      <svg style={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M22 16.9v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3 5.18 2 2 0 0 1 5.1 3h3a2 2 0 0 1 2 1.72c.12.86.32 1.7.6 2.5a2 2 0 0 1-.45 2.11L9.1 10.5a16 16 0 0 0 4.4 4.4l1.17-1.15a2 2 0 0 1 2.11-.45c.8.28 1.64.48 2.5.6A2 2 0 0 1 22 16.9Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )

  if (type === 'id')
    return (
      <svg style={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M8 11h8M8 15h5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    )

  if (type === 'calendar')
    return (
      <svg style={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 3v3M17 3v3M4 8h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path
          d="M5 6h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </svg>
    )

  if (type === 'bell')
    return (
      <svg style={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M15 17H9m9-2V11a6 6 0 1 0-12 0v4l-2 2h16l-2-2Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 21a2 2 0 0 0 4 0"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    )

  return null
}

function Badge({ tone = 'neutral', children }) {
  const styles = {
    neutral: { bg: '#eef2ff', bd: '#c7d2fe', fg: '#3730a3' },
    success: { bg: '#ecfdf5', bd: '#a7f3d0', fg: '#065f46' },
    danger: { bg: '#fef2f2', bd: '#fecaca', fg: '#991b1b' },
    warn: { bg: '#fffbeb', bd: '#fde68a', fg: '#92400e' },
    info: { bg: '#eff6ff', bd: '#bfdbfe', fg: '#1e40af' },
  }[tone]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 999,
        border: `1px solid ${styles.bd}`,
        background: styles.bg,
        color: styles.fg,
        fontWeight: 900,
        fontSize: 12,
        letterSpacing: 0.2,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function Button({ disabled, onClick, children }) {
  return (
    <button
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={{
        border: '1px solid #e5e7eb',
        background: disabled ? '#f3f4f6' : '#fff',
        color: disabled ? '#9ca3af' : '#111827',
        borderRadius: 14,
        padding: '10px 12px',
        fontWeight: 900,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
        transition: 'transform .12s ease, background .12s ease',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.background = '#f9fafb'
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        e.currentTarget.style.transform = 'translateY(0px)'
        e.currentTarget.style.background = '#fff'
      }}
    >
      {children}
    </button>
  )
}

function Card({ title, subtitle, right, children }) {
  return (
    <section
      style={{
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(229,231,235,0.9)',
        borderRadius: 22,
        padding: 18,
        boxShadow: '0 16px 44px rgba(0,0,0,0.07)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 980, color: '#111827' }}>{title}</div>
          {subtitle && <div style={{ marginTop: 6, color: '#6b7280', fontSize: 13 }}>{subtitle}</div>}
        </div>
        {right}
      </div>
      <div style={{ marginTop: 14 }}>{children}</div>
    </section>
  )
}

function InfoRow({ icon, label, value, mono }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        padding: '12px 12px',
        borderRadius: 16,
        border: '1px solid #eef2f7',
        background: '#fff',
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 14,
          display: 'grid',
          placeItems: 'center',
          background: '#f3f4f6',
          border: '1px solid #e5e7eb',
          color: '#111827',
          flex: '0 0 auto',
        }}
      >
        <Icon type={icon} />
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ color: '#6b7280', fontWeight: 900, fontSize: 12 }}>{label}</div>
        <div
          style={{
            marginTop: 4,
            color: '#111827',
            fontWeight: 950,
            wordBreak: 'break-word',
            ...(mono ? monospaceStyle() : {}),
          }}
        >
          {value ?? '-'}
        </div>
      </div>
    </div>
  )
}

/* ----------------------------- page ----------------------------- */
export default function Home() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deproc, setDeproc] = useState(null)
  const ranRef = useRef(false)

  const status = useMemo(() => {
    if (loading) return { tone: 'warn', text: 'กำลังดึงข้อมูล Deproc…', icon: 'load' }
    if (error) return { tone: 'danger', text: 'ไม่สำเร็จ', icon: 'warn' }
    if (deproc) return { tone: 'success', text: 'ดึงข้อมูลสำเร็จ', icon: 'ok' }
    return { tone: 'neutral', text: 'รอข้อมูล', icon: 'load' }
  }, [loading, error, deproc])

  const fullName = useMemo(() => {
    if (!deproc) return '-'
    return [deproc.firstName, deproc.lastName].filter(Boolean).join(' ') || '-'
  }, [deproc])

  const rows = useMemo(() => {
    if (!deproc) return []
    return [
      { icon: 'user', label: 'ชื่อ-นามสกุล', value: fullName },
      { icon: 'mail', label: 'อีเมล', value: deproc.email ?? '-' },
      { icon: 'phone', label: 'โทรศัพท์', value: deproc.mobile ?? '-', mono: true },
      { icon: 'id', label: 'Citizen ID', value: deproc.citizenId ?? '-', mono: true },
      { icon: 'calendar', label: 'วันเกิด', value: deproc.dateOfBirthString ?? '-', mono: true },
      { icon: 'bell', label: 'การแจ้งเตือน', value: deproc.notification ?? '-' },
      ...(deproc.userId ? [{ icon: 'id', label: 'User ID', value: deproc.userId, mono: true }] : []),
    ]
  }, [deproc, fullName])

  async function runRequest(signal) {
    setLoading(true)
    setError(null)
    setDeproc(null)

    try {
      const params = new URLSearchParams(window.location.search)
      const appId = params.get('appId')
      const mToken = params.get('mToken')

      if (!appId || !mToken) throw new Error('ไม่พบพารามิเตอร์ appId หรือ mToken ใน URL')


      const ENDPOINT = 'https://czp-staging.biza.me/test6/api/egov/'

      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, mToken }),
        signal, 
      })

      const text = await res.text().catch(() => '')
      const json = safeJsonParse(text)

      if (!res.ok) {
        const msg =
          json?.error ||
          json?.message ||
          (json?.step ? `ขั้นตอนที่ผิดพลาด: ${json.step}` : null) ||
          text ||
          `Request failed: ${res.status}`
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
      }

      const payload = json ?? {}
      const deprocData =
        payload?.data ||
        payload?.deproc ||
        payload?.citizen ||
        payload?.saved ||
        payload?.result ||
        null

      if (!deprocData || typeof deprocData !== 'object') {
        throw new Error('ไม่พบข้อมูล Deproc ใน response (ตรวจสอบ payload.data / payload.deproc)')
      }

      setDeproc(deprocData)
    } catch (err) {
      if (err?.name === 'AbortError') return
      setError(String(err?.message || err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true
    const controller = new AbortController()
    runRequest(controller.signal)
    return () => controller.abort()
  }, [])

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(1200px 600px at 10% 10%, rgba(37,99,235,0.12), transparent 60%),' +
          'radial-gradient(900px 420px at 95% 20%, rgba(16,185,129,0.12), transparent 55%),' +
          'radial-gradient(900px 520px at 40% 110%, rgba(99,102,241,0.10), transparent 55%),' +
          '#f8fafc',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 22 }}>
        {/* Header */}
        <div
          style={{
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(229,231,235,0.9)',
            borderRadius: 22,
            padding: 18,
            boxShadow: '0 16px 44px rgba(0,0,0,0.07)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 950, color: '#6b7280', letterSpacing: 0.3 }}>
                ระบบสาธิตการเชื่อมโยงบริการภาครัฐ (DGA / eGov)
              </div>
              <h1 style={{ margin: '10px 0 0', fontSize: 28, fontWeight: 990, color: '#111827' }}>
                ข้อมูลผู้ใช้จาก Deproc
              </h1>
              <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 14 }}>
                หน้านี้จะแสดงเฉพาะข้อมูลที่ backend ส่งกลับจาก <b>Deproc</b> เท่านั้น
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Badge tone={status.tone}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon type={status.icon} />
                  {status.text}
                </span>
              </Badge>

              <Button
                disabled={loading}
                onClick={() => {
                  const controller = new AbortController()
                  runRequest(controller.signal)
                }}
              >
                ดึงข้อมูลใหม่
              </Button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 18,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              whiteSpace: 'pre-wrap',
              fontWeight: 900,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              boxShadow: '0 12px 28px rgba(153,27,27,0.08)',
            }}
          >
            <span style={{ marginTop: 2 }}>
              <Icon type="warn" />
            </span>
            <div>
              <div style={{ fontWeight: 990 }}>เกิดข้อผิดพลาด</div>
              <div style={{ marginTop: 6, fontWeight: 850 }}>{error}</div>
            </div>
          </div>
        )}

        {/* Deproc Card */}
        <div style={{ marginTop: 14 }}>
          <Card
            title="รายละเอียดข้อมูลผู้ใช้ (Deproc)"
            subtitle={loading ? 'กำลังประมวลผล…' : deproc ? 'ข้อมูลพร้อมใช้งาน' : 'รอการดึงข้อมูล'}
            right={
              deproc ? (
                <Badge tone="info">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Icon type="ok" />
                    Verified
                  </span>
                </Badge>
              ) : (
                <Badge tone="neutral">—</Badge>
              )
            }
          >
            {!deproc ? (
              <div
                style={{
                  padding: 14,
                  borderRadius: 18,
                  background: '#fff',
                  border: '1px dashed #e5e7eb',
                  color: '#6b7280',
                  fontWeight: 900,
                }}
              >
                {loading
                  ? 'กำลังโหลดข้อมูลจาก Deproc…'
                  : 'ยังไม่มีข้อมูล (กรุณาตรวจสอบว่า backend ส่งข้อมูล Deproc กลับมาหรือไม่)'}
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 12,
                }}
              >
                {rows.map((r, i) => (
                  <InfoRow key={i} icon={r.icon} label={r.label} value={r.value} mono={r.mono} />
                ))}
              </div>
            )}
          </Card>
        </div>

        <footer style={{ marginTop: 18, color: '#9ca3af', fontSize: 12, textAlign: 'center' }}>
          © {new Date().getFullYear()} • DGA Demo UI • แสดงผลเฉพาะ Deproc Data
        </footer>
      </div>

      {/* Responsive: ถ้าจอเล็กให้เหลือ 1 คอลัมน์ */}
      <style>{`
        @media (max-width: 720px) {
          section > div > div + div { margin-top: 12px; }
        }
      `}</style>
    </main>
  )
}
