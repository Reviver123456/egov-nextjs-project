import connectToDatabase from '../../lib/db'
import User from '../../models/User'

function safeJsonParse(text) {
  if (!text || !text.trim()) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function readResp(resp) {
  const contentType = resp.headers.get('content-type') || ''
  const text = await resp.text().catch(() => '')
  const json = contentType.includes('application/json') ? safeJsonParse(text) : safeJsonParse(text)
  return { contentType, text, json }
}

function pickToken(validateJson) {
  return (
    validateJson?.Result ||
    validateJson?.result ||
    validateJson?.Token ||
    validateJson?.token ||
    null
  )
}

function pickCitizen(deprocJson) {
  const root = deprocJson ?? null
  const cand =
    root?.result ||
    root?.Result ||
    root?.data ||
    root?.Data ||
    root ||
    null
  return cand?.result || cand?.data || cand
}

function maskToken(t) {
  if (!t || typeof t !== 'string') return null
  if (t.length <= 8) return '********'
  return `${t.slice(0, 4)}********${t.slice(-4)}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { appId, mToken } = req.body || {}
  if (!appId || !mToken) return res.status(400).json({ error: 'appId and mToken are required' })

  const consumerKey = process.env.EGOV_CONSUMER_KEY
  const consumerSecret = process.env.EGOV_CONSUMER_SECRET
  const agentId = process.env.EGOV_AGENT_ID

  if (!consumerKey || !consumerSecret || !agentId) {
    return res.status(500).json({
      status: 'error',
      message: 'Missing EGOV env (EGOV_CONSUMER_KEY / EGOV_CONSUMER_SECRET / EGOV_AGENT_ID)',
    })
  }

  const debugInfo = { step1: null, step2: null, step3: false }

  try {
    // ✅ Step 1: validate -> token
    const validateUrl =
      `https://api.egov.go.th/ws/auth/validate` +
      `?ConsumerSecret=${encodeURIComponent(consumerSecret)}` +
      `&AgentID=${encodeURIComponent(agentId)}`

    const validateResp = await fetch(validateUrl, {
      method: 'GET',
      headers: {
        'Consumer-Key': consumerKey,
        Accept: 'application/json',
      },
    })

    const validateBody = await readResp(validateResp)

    if (!validateResp.ok) {
      return res.status(502).json({
        step: 'validate',
        status: validateResp.status,
        contentType: validateBody.contentType,
        error: validateBody.json ?? validateBody.text ?? null,
      })
    }

    const token = pickToken(validateBody.json)
    if (!token) {
      return res.status(500).json({
        step: 'validate',
        error: 'Token not found',
        raw: validateBody.json ?? validateBody.text ?? null,
      })
    }

    debugInfo.step1 = maskToken(token)

    // ✅ Step 2: deproc -> profile 
    const deprocUrl = process.env.DEPROC_API_URL
      || 'https://api.egov.go.th/ws/dga/czp/uat/v1/core/shield/data/deproc'

    const deprocResp = await fetch(deprocUrl, {
      method: 'POST',
      headers: {
        'Consumer-Key': consumerKey,
        Token: token,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ AppId: appId, MToken: mToken }), 
    })

    const deprocBody = await readResp(deprocResp)

    if (!deprocResp.ok) {
      return res.status(502).json({
        step: 'deproc',
        status: deprocResp.status,
        contentType: deprocBody.contentType,
        error: deprocBody.json ?? deprocBody.text ?? null,
      })
    }

    debugInfo.step2 = deprocBody.json ?? { raw: deprocBody.text }

    const citizen = pickCitizen(deprocBody.json)
    if (!citizen) {
      throw new Error('Deproc returned NULL (Token expired / wrong response shape / wrong body keys)')
    }

    // ✅ Step 3: Save DB 
    await connectToDatabase()

    const saved = {
      userId: citizen.userId,
      citizenId: citizen.citizenId,
      firstName: citizen.firstName,
      lastName: citizen.lastName,
      dateOfBirthString: citizen.dateOfBirthString,
      mobile: citizen.mobile,
      email: citizen.email,
      notification: citizen.notification,
    }

    // อัปเดตตาม citizenId (เหมือน ON CONFLICT citizen_id)
    await User.findOneAndUpdate(
      { citizenId: saved.citizenId },
      {
        $set: {
          ...saved,
          appId, // ถ้าคุณอยากเก็บ appId ด้วย
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true }
    )

    debugInfo.step3 = true

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      debug: debugInfo,
      data: {
        firstName: saved.firstName,
        lastName: saved.lastName,
        userId: saved.userId,
        appId,
      },
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({
      status: 'error',
      message: err?.message || 'Unexpected error',
      debug: debugInfo,
    })
  }
}
