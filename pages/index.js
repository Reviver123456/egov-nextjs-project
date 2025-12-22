import { useEffect } from 'react'
import { useRouter } from 'next/router'
import styles from '../styles/Gate.module.css'

const apiPath = (router, path) => `${router.basePath || ''}${path}`

export default function IndexGate() {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return

    const { appId, mToken } = router.query

    if (!appId || !mToken) {
      router.replace('/login')
      return
    }

    fetch(apiPath(router, '/api/egov'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId, mToken, mode: 'check' }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json?.found) {
          router.replace({ pathname: '/home', query: router.query })
        } else {
          router.replace({ pathname: '/login', query: router.query })
        }
      })
      .catch(() => router.replace({ pathname: '/login', query: router.query }))
  }, [router.isReady])

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.kicker}>DGA / eGov</div>
        <div className={styles.title}>กำลังตรวจสอบข้อมูลในระบบ…</div>
        <div className={styles.sub}>กรุณารอสักครู่</div>
      </section>
    </main>
  )
}
