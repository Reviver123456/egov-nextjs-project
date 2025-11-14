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

        // ----------------------
        // ✔ ใช้จาก SDK ถ้ามี
        // ----------------------
        if (
          window?.czpSdk &&
          typeof window.czpSdk.getAppId === "function" &&
          typeof window.czpSdk.getToken === "function"
        ) {
          appId = window.czpSdk.getAppId()
          mToken = window.czpSdk.getToken()
          console.log("SDK:", appId, mToken)
        }

        // ----------------------
        // ✔ fallback จาก URL
        // ----------------------
        if (!appId || !mToken) {
          const params = new URLSearchParams(window.location.search)
          appId = params.get("appId")
          mToken = params.get("mToken")
          console.log("URL:", appId, mToken)
        }

        if (!appId || !mToken) {
          throw new Error("Missing appId or mToken (SDK or URL)")
        }

        // ----------------------
        // ✔ เรียก backend API
        // ----------------------
        const res = await fetch("/api/egov", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appId, mToken })
        })

        const raw = await res.text()

        if (raw.startsWith("<!DOCTYPE") || raw.startsWith("<html")) {
          throw new Error("Backend returned HTML instead of JSON")
        }

        const data = JSON.parse(raw)

        if (!res.ok) {
          throw new Error(JSON.stringify(data))
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
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h1>DGA CZP — DeProc Demo</h1>

      {loading && <p>Processing...</p>}
      {error && <pre style={{ color: "red" }}>{error}</pre>}

      <h2>Result</h2>
      <pre>{result ? JSON.stringify(result, null, 2) : "No result"}</pre>
    </div>
  )
}
