import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import styles from '../../styles/Auth.module.css'

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

export default function LoginPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  const canLogin = useMemo(() => {
    // ต้องมี appId + mToken ใน URL
    if (!router.isReady) return false
    const { appId, mToken } = router.query || {}
    return Boolean(appId && mToken)
  }, [router.isReady, router.query])

  async function handleLogin() {
    setLoading(true)
    setErr(null)

    try {
      const { appId, mToken } = router.query || {}
      if (!appId || !mToken) throw new Error('ไม่พบ appId หรือ mToken ใน URL')

      const res = await fetch(apiPath(router, '/api/egov'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, mToken }),
      })

      const text = await res.text().catch(() => '')
      const json = safeJsonParse(text)

      if (!res.ok) {
        const msg = json?.message || json?.error || text || `Request failed: ${res.status}`
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
      }

      // ✅ login สำเร็จ -> ไป home
      router.replace(apiPath(router, '/home'))
    } catch (e) {
      setErr(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.kicker}>DGA / eGov</div>
        <h1 className={styles.title}>Login</h1>
        <p className={styles.desc}>
          ไม่พบข้อมูลในฐานข้อมูล กรุณากดปุ่ม <b>Login</b> เพื่อดึงข้อมูลและบันทึกลงระบบ
        </p>

        {err ? <div className={styles.error}>{err}</div> : null}

        <button
          className={styles.primaryBtn}
          onClick={handleLogin}
          disabled={!canLogin || loading}
          type="button"
        >
          {loading ? 'กำลังเข้าสู่ระบบ…' : 'Login'}
        </button>

        {!canLogin ? (
          <div className={styles.hint}>* ต้องมีพารามิเตอร์ appId และ mToken ใน URL</div>
        ) : null}
      </section>
    </main>
  )
}
