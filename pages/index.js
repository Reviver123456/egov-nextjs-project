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

function mask(value, head = 10, tail = 6) {
  if (!value) return '-'
  const s = String(value)
  if (s.length <= head + tail) return s
  return `${s.slice(0, head)}…${s.slice(-tail)}`
}

function monospaceStyle() {
  return { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }
}

function Icon({ type }) {
  // Minimal inline icons (no deps)
  const base = { width: 18, height: 18, display: 'inline-block' }
  if (type === 'ok')
    return (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (type === 'warn')
    return (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (type === 'load')
    return (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <path d="M12 2v4m0 12v4m10-10h-4M6 12H2m16.95 6.95-2.83-2.83M9.88 9.88 7.05 7.05m11.9 0-2.83 2.83M9.88 14.12l-2.83 2.83" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
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
        fontWeight: 800,
        fontSize: 12,
        letterSpacing: 0.2,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function Button({ variant = 'primary', disabled, onClick, children }) {
  const v = {
    primary: {
      bg: disabled ? '#93c5fd' : '#2563eb',
      fg: '#fff',
      bd: 'transparent',
      hover: disabled ? '#93c5fd' : '#1d4ed8',
    },
    ghost: {
      bg: disabled ? '#f3f4f6' : '#fff',
      fg: disabled ? '#9ca3af' : '#111827',
      bd: '#e5e7eb',
      hover: disabled ? '#f3f4f6' : '#f9fafb',
    },
    danger: {
      bg: disabled ? '#fecaca' : '#dc2626',
      fg: '#fff',
      bd: 'transparent',
      hover: disabled ? '#fecaca' : '#b91c1c',
    },
  }[variant]

  return (
    <button
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={{
        border: `1px solid ${v.bd}`,
        background: v.bg,
        color: v.fg,
        borderRadius: 12,
        padding: '10px 12px',
        fontWeight: 800,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: variant === 'primary' ? '0 8px 20px rgba(37,99,235,0.18)' : 'none',
        transition: 'background .15s ease',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.background = v.hover
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        e.currentTarget.style.background = v.bg
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
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 18,
        padding: 18,
        boxShadow: '0 10px 28px rgba(0,0,0,0.06)',
        marginTop: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#111827' }}>{title}</div>
          {subtitle && <div style={{ marginTop: 4, color: '#6b7280', fontSize: 13 }}>{subtitle}</div>}
        </div>
        {right}
      </div>
      <div style={{ marginTop: 12 }}>{children}</div>
    </section>
  )
}

function Field({ label, value, mono, highlight }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '190px 1fr',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px dashed #e5e7eb',
      }}
    >
      <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 800 }}>{label}</div>
      <div
        style={{
          fontWeight: 800,
          color: highlight ? '#111827' : '#111827',
          wordBreak: 'break-word',
          ...(mono ? monospaceStyle() : {}),
        }}
      >
        {value ?? '-'}
      </div>
    </div>
  )
}

function Stepper({ step, loading }) {
  const steps = [
    { key: 'validate', label: 'ขอ Token (Validate)' },
    { key: 'deproc', label: 'ขอข้อมูลผู้ใช้ (Deproc)' },
    { key: 'save', label: 'บันทึกฐานข้อมูล' },
  ]

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {steps.map((s, idx) => {
        const isActive = loading && (step === s.key)
        const isDone = !loading && (step === s.key || (step === 'done' && idx <= 2))
        const tone = isDone ? 'success' : isActive ? 'info' : 'neutral'

        return (
          <div
            key={s.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 14,
              border: '1px solid #e5e7eb',
              background: '#fff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  display: 'grid',
                  placeItems: 'center',
                  background: isDone ? '#ecfdf5' : isActive ? '#eff6ff' : '#f3f4f6',
                  color: isDone ? '#065f46' : isActive ? '#1e40af' : '#6b7280',
                  border: '1px solid #e5e7eb',
                }}
              >
                {isActive ? <Icon type="load" /> : isDone ? <Icon type="ok" /> : <span style={{ fontWeight: 900 }}>{idx + 1}</span>}
              </div>
              <div style={{ fontWeight: 900, color: '#111827' }}>{s.label}</div>
            </div>
            <Badge tone={tone}>{isActive ? 'กำลังดำเนินการ' : isDone ? 'สำเร็จ' : 'รอดำเนินการ'}</Badge>
          </div>
        )
      })}
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

  const [rawOpen, setRawOpen] = useState(false)
  const [debug, setDebug] = useState(null)

  const [showToken, setShowToken] = useState(false)
  const [copied, setCopied] = useState(false)

  // step state
  const [step, setStep] = useState('validate') // validate | deproc | save | done
  const [failedStep, setFailedStep] = useState(null)

  const ranRef = useRef(false)

  const status = useMemo(() => {
    if (loading) return { tone: 'warn', text: 'กำลังดำเนินการ' }
    if (error) return { tone: 'danger', text: 'ไม่สำเร็จ' }
    if (backendToken || saved) return { tone: 'success', text: 'สำเร็จ' }
    return { tone: 'neutral', text: 'รอข้อมูล' }
  }, [loading, error, backendToken, saved])

  async function runRequest(signal) {
    setLoading(true)
    setError(null)
    setBackendToken(null)
    setSaved(null)
    setDebug(null)
    setShowToken(false)
    setCopied(false)
    setFailedStep(null)
    setStep('validate')

    try {
      const params = new URLSearchParams(window.location.search)
      const _appId = params.get('appId')
      const _mToken = params.get('mToken')

      setAppId(_appId)
      setMToken(_mToken)

      if (!_appId || !_mToken) {
        throw new Error('ไม่พบพารามิเตอร์ appId หรือ mToken ใน URL')
      }

      const res = await fetch('/api/egov', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: _appId, mToken: _mToken }),
        signal,
      })

      const contentType = res.headers.get('content-type') || ''
      const text = await res.text().catch(() => '')
      const json = safeJsonParse(text)

      // debug meta
      setDebug({
        ok: res.ok,
        status: res.status,
        contentType,
        rawText: (text || '').slice(0, 8000),
      })

      if (!res.ok) {
        const stepFromApi = json?.step || null
        if (stepFromApi) setFailedStep(stepFromApi)
        const msg =
          json?.error ||
          json?.message ||
          (json?.step ? `ขั้นตอนที่ผิดพลาด: ${json.step}` : null) ||
          text ||
          `Request failed: ${res.status}`
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
      }

      // payload: เวอร์ชันใหม่ backend จะส่ง status/message/debug/data
      // แต่รองรับของเดิมที่ส่ง token/saved ด้วย
      const payload = json ?? {}
      setStep('deproc') // UI only (backend ทำครบในครั้งเดียว)

      // token from backend
      const token =
        payload?.token ||
        payload?.debug?.step1 || // เผื่อ backend ส่ง masked
        null
      setBackendToken(payload?.token || null)

      // citizen saved object (รองรับทั้ง data/saved)
      const citizenSaved = payload?.saved || payload?.data || null
      setSaved(citizenSaved)

      setStep('done')
    } catch (err) {
      if (err?.name === 'AbortError') return
      setError(String(err?.message || err))
      setStep('done')
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

  async function copyToken() {
    if (!backendToken) return
    try {
      await navigator.clipboard.writeText(backendToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = backendToken
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      } catch {}
    }
  }

  function toneToIcon(tone) {
    if (tone === 'success') return <Icon type="ok" />
    if (tone === 'danger') return <Icon type="warn" />
    if (tone === 'warn') return <Icon type="load" />
    return null
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(1200px 600px at 10% 10%, rgba(37,99,235,0.10), transparent 60%),' +
          'radial-gradient(900px 420px at 95% 20%, rgba(16,185,129,0.10), transparent 55%),' +
          '#f8fafc',
      }}
    >
      <div style={{ maxWidth: 980, margin: '0 auto', padding: 22 }}>
        {/* Header */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 18,
            padding: 18,
            boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#6b7280', letterSpacing: 0.3 }}>
                ระบบสาธิตการเชื่อมโยงบริการภาครัฐ (DGA / eGov)
              </div>
              <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 950, color: '#111827' }}>
                หน้าจอแสดงผลการยืนยันตัวตนและดึงข้อมูลผู้ใช้
              </h1>
              <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 14 }}>
                แสดงข้อมูลเป็นหัวข้อ อ่านง่าย พร้อมโหมด Debug สำหรับการตรวจสอบ (แนะนำปิดเมื่อใช้งานจริง)
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Badge tone={status.tone}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {toneToIcon(status.tone)}
                  {status.text}
                </span>
              </Badge>

              <Button
                variant="ghost"
                disabled={loading}
                onClick={() => {
                  const controller = new AbortController()
                  runRequest(controller.signal)
                }}
              >
                Retry
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
              borderRadius: 16,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              whiteSpace: 'pre-wrap',
              fontWeight: 850,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ marginTop: 2 }}><Icon type="warn" /></span>
            <div>
              <div style={{ fontWeight: 950 }}>เกิดข้อผิดพลาดในการดำเนินการ</div>
              <div style={{ marginTop: 4, fontWeight: 700 }}>
                {failedStep ? `ขั้นตอนที่ผิดพลาด: ${failedStep}` : null}
              </div>
              <div style={{ marginTop: 6, fontWeight: 700 }}>{error}</div>
            </div>
          </div>
        )}

        {/* Stepper */}
        <Card
          title="สถานะการดำเนินการ"
          subtitle="ลำดับขั้นตอนการเรียกใช้งานบริการ: Validate → Deproc → บันทึกข้อมูล"
          right={<Badge tone={loading ? 'warn' : error ? 'danger' : 'success'}>{loading ? 'กำลังดำเนินการ' : error ? 'ไม่สำเร็จ' : 'พร้อมใช้งาน'}</Badge>}
        >
          <Stepper step={failedStep || step} loading={loading} />
        </Card>

        {/* Params */}
        <Card title="พารามิเตอร์จาก URL" subtitle="ค่าที่รับมาจากระบบต้นทาง (Query String)">
          <Field label="appId" value={appId ? mask(appId, 12, 8) : '-'} mono />
          <Field label="mToken" value={mToken ? mask(mToken, 12, 8) : '-'} mono />
        </Card>

        {/* Token */}
        <Card
          title="Token สำหรับเรียกบริการ (Validate Result)"
          subtitle="แสดงแบบย่อโดยค่าเริ่มต้น เพื่อความปลอดภัย"
          right={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button variant="ghost" disabled={!backendToken} onClick={() => setShowToken(v => !v)}>
                {showToken ? 'ซ่อน Token' : 'แสดง Token'}
              </Button>
              <Button variant="ghost" disabled={!backendToken} onClick={copyToken}>
                {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
              </Button>
            </div>
          }
        >
          <Field
            label="token"
            mono
            value={
              backendToken
                ? showToken
                  ? <span style={monospaceStyle()}>{backendToken}</span>
                  : mask(backendToken, 16, 10)
                : '-'
            }
          />
          <div style={{ marginTop: 10, color: '#6b7280', fontSize: 13 }}>
            หมายเหตุ: เพื่อความปลอดภัย แนะนำให้ปิดการแสดง Token เต็มในระบบใช้งานจริง
          </div>
        </Card>

        {/* Citizen */}
        <Card title="ข้อมูลผู้ใช้ (Citizen Data)" subtitle="ข้อมูลที่ได้รับจาก Deproc และบันทึกลงฐานข้อมูล">
          {!saved ? (
            <div style={{ color: '#6b7280', fontWeight: 700 }}>ยังไม่มีข้อมูล (รอ backend ตอบ หรือเกิดข้อผิดพลาด)</div>
          ) : (
            <>
              <Field label="userId" value={saved.userId ?? '-'} mono />
              <Field label="citizenId" value={saved.citizenId ?? '-'} mono />
              <Field label="ชื่อ" value={saved.firstName ?? '-'} />
              <Field label="นามสกุล" value={saved.lastName ?? '-'} />
              <Field label="วันเกิด" value={saved.dateOfBirthString ?? '-'} mono />
              <Field label="โทรศัพท์" value={saved.mobile ?? '-'} mono />
              <Field label="อีเมล" value={saved.email ?? '-'} />
              <Field label="การแจ้งเตือน" value={saved.notification ?? '-'} />
            </>
          )}
        </Card>

        {/* Debug */}
        <Card
          title="Debug (Raw Response)"
          subtitle="สำหรับตรวจสอบผลลัพธ์ดิบจาก Backend"
          right={
            <Button variant="ghost" disabled={!debug} onClick={() => setRawOpen(v => !v)}>
              {rawOpen ? 'ซ่อน' : 'แสดง'}
            </Button>
          }
        >
          {!debug ? (
            <div style={{ color: '#6b7280', fontWeight: 700 }}>ยังไม่มีข้อมูล Debug</div>
          ) : (
            <>
              <Field label="HTTP Status" value={String(debug.status)} mono />
              <Field label="Content-Type" value={debug.contentType || '-'} mono />
              {rawOpen && (
                <pre
                  style={{
                    marginTop: 12,
                    padding: 14,
                    borderRadius: 16,
                    background: '#0b1020',
                    color: '#e5e7eb',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {debug.rawText || ''}
                </pre>
              )}
            </>
          )}
        </Card>

        <footer style={{ marginTop: 18, color: '#9ca3af', fontSize: 12, textAlign: 'center' }}>
          © {new Date().getFullYear()} • DGA Demo UI • สำหรับสาธิตและทดสอบการเชื่อมต่อเท่านั้น
        </footer>
      </div>
    </main>
  )
}
