import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import styles from '../../styles/Gate.module.css'

function apiPath(router, path) {
  return `${router.basePath || ''}${path}`
}

function safeJsonParse(text) {
  if (!text || !text.trim()) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export default function HomePage() {
  const router = useRouter()
  const ranRef = useRef(false)

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [user, setUser] = useState(null)

  const fullName = useMemo(() => {
    if (!user) return '-'
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || '-'
  }, [user])

  async function loadProfile(signal) {
    setLoading(true)
    setErr(null)

    try {
      // ✅ เรียก API เช็คว่ามี user ใน DB ไหม
      const res = await fetch(apiPath(router, '/api/profile'), { method: 'GET', signal })
      const text = await res.text().catch(() => '')
      const json = safeJsonParse(text)

      if (!res.ok) {
        const msg = json?.message || json?.error || text || `Request failed: ${res.status}`
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
      }

      // ถ้าไม่มี user -> redirect ไป login
      if (!json?.data) {
        router.replace(apiPath(router, '/login'))
        return
      }

      setUser(json.data)
    } catch (e) {
      if (e?.name === 'AbortError') return
      setErr(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!router.isReady) return
    if (ranRef.current) return
    ranRef.current = true

    const controller = new AbortController()
    loadProfile(controller.signal)
    return () => controller.abort()
  }, [router.isReady])

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.kicker}>DGA / eGov</div>
        <h1 className={styles.title}>Home</h1>

        <div className={styles.label}>ชื่อ-นามสกุล</div>
        <div className={styles.value}>{loading ? 'กำลังโหลด…' : fullName}</div>

        {err ? <div className={styles.error}>{err}</div> : null}
      </section>
    </main>
  )
}
