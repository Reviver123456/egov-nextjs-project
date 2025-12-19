

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
  const json = safeJsonParse(text)
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { appId, mToken } = req.body || {}
  if (!appId || !mToken) return res.status(400).json({ error: 'appId and mToken are required' })

  // ✅ แนะนำให้ใช้ .env จริง (อย่า hardcode secret ในโปรดักชัน)
  const consumerKey =
    process.env.EGOV_CONSUMER_KEY || '2907f3d6-19e5-4545-a058-b7077f342bfa'
  const consumerSecret =
    process.env.EGOV_CONSUMER_SECRET || 'TP0mPcTfAFJ'
  const agentId =
    process.env.EGOV_AGENT_ID || '8a816448-0207-45f4-8613-65b0ad80afd0'

  try {

    const validateUrl =
      `https://api.egov.go.th/ws/auth/validate` +
      `?ConsumerSecret=${encodeURIComponent(consumerSecret)}` +
      `&AgentID=${encodeURIComponent(agentId)}`

    const validateResp = await fetch(validateUrl, {
      method: 'GET',
      headers: {
        'Consumer-Key': consumerKey,
        'Accept': 'application/json',
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

    // ✅ 2) deproc
    const deprocUrl =
      'https://api.egov.go.th/ws/dga/czp/uat/v1/core/shield/data/deproc'

    const deprocResp = await fetch(deprocUrl, {
      method: 'POST',
      headers: {
        'Consumer-Key': consumerKey,
        'Token': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ appId, mToken }),
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

    const citizen =
      deprocBody.json?.result || deprocBody.json?.data || deprocBody.json

    const saved = citizen
      ? {
          userId: citizen.userId,
          citizenId: citizen.citizenId,
          firstName: citizen.firstName,
          lastName: citizen.lastName,
          dateOfBirthString: citizen.dateOfBirthString,
          mobile: citizen.mobile,
          email: citizen.email,
          notification: citizen.notification,
        }
      : null


    return res.status(200).json({
      ok: true,
      token,
      saved,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err?.message || 'Unexpected error' })
  }
}
