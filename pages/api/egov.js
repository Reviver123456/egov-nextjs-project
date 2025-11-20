import connectToDatabase from '../../lib/db'
import User from '../../models/User'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { appId, mToken } = req.body || {}

  if (!appId || !mToken) {
    return res.status(400).json({ error: 'appId and mToken are required' })
  }

  const consumerKey = "2907f3d6-19e5-4545-a058-b7077f342bfa"
  const consumerSecret = "TP0mPcTfAFJ"
  const agentId = "8a816448-0207-45f4-8613-65b0ad80afd0"

  try {
    // -----------------------------------------------------
    // STEP 1: GEN TOKEN (VALIDATE)
    // -----------------------------------------------------
    const validateUrl =
      `https://api.egov.go.th/ws/auth/validate?ConsumerSecret=${encodeURIComponent(
        consumerSecret
      )}&AgentID=${encodeURIComponent(agentId)}`

    const validateResp = await fetch(validateUrl, {
      method: 'GET',
      headers: {
        'Consumer-Key': consumerKey,
        'Content-Type': 'application/json'
      }
    })

    const validateJson = await validateResp.json().catch(() => null)

    if (!validateResp.ok) {
      return res.status(502).json({ step: 'validate', error: validateJson })
    }

    // 🟢 Token ที่ต้องส่งกลับไปให้ frontend
    const token =
      validateJson?.Result ||
      validateJson?.result ||
      validateJson?.Token

    if (!token) {
      return res.status(500).json({ error: 'Token not found' })
    }

    // -----------------------------------------------------
    // STEP 2: DEPROC
    // -----------------------------------------------------
    const deprocUrl =
      'https://api.egov.go.th/ws/dga/czp/uat/v1/core/shield/data/deproc'

    const deprocResp = await fetch(deprocUrl, {
      method: 'POST',
      headers: {
        'Consumer-Key': consumerKey,
        'Token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ appId, mToken })
    })

    const deprocJson = await deprocResp.json().catch(() => null)

    if (!deprocResp.ok) {
      return res.status(502).json({ step: 'deproc', error: deprocJson })
    }

    let citizen = deprocJson?.result || deprocJson?.data || deprocJson

    const saved = citizen ? {
      userId: citizen.userId,
      citizenId: citizen.citizenId,
      firstName: citizen.firstName,
      lastName: citizen.lastName,
      dateOfBirthString: citizen.dateOfBirthString,
      mobile: citizen.mobile,
      email: citizen.email,
      notification: citizen.notification
    } : null

    // -----------------------------------------------------
    // STEP 3: ส่ง Response กลับไป
    // -----------------------------------------------------
    return res.status(200).json({
      ok: true,
      token,   // 🟩 ส่งกลับไป
      appId,   // 🟩 ส่งกลับไป
      mToken,  // 🟩 ส่งกลับไป
      saved    // 🟩 ผลลัพธ์จาก deproc
    })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}
