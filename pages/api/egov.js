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
  return validateJson?.Result || validateJson?.result || validateJson?.Token || validateJson?.token || null
}

function maskToken(t) {
  if (!t || typeof t !== 'string') return null
  if (t.length <= 8) return '********'
  return `${t.slice(0, 4)}********${t.slice(-4)}`
}

/* ----------------------- deep pick citizen ----------------------- */
/**
 * Deproc response บางที citizenId อยู่ลึก/คนละ key
 * ฟังก์ชันนี้จะ “ไล่หา object ที่มี citizenId” แบบลึก (กัน shape เปลี่ยน)
 */
function deepFindCitizen(root) {
  const seen = new Set()
  const queue = [{ v: root, depth: 0 }]

  while (queue.length) {
    const { v, depth } = queue.shift()
    if (!v || typeof v !== 'object') continue
    if (seen.has(v)) continue
    seen.add(v)

    // ถ้าเจอ object ที่มี citizenId -> ถือว่าใช่
    if (typeof v.citizenId === 'string' && v.citizenId.trim()) return v
    if (typeof v.CitizenID === 'string' && v.CitizenID.trim()) return { ...v, citizenId: v.CitizenID }

    // บางระบบคืนเป็น citizen_id
    if (typeof v.citizen_id === 'string' && v.citizen_id.trim()) return { ...v, citizenId: v.citizen_id }

    // จำกัดความลึกกันวน
    if (depth >= 10) continue

    // เดินทุก key
    for (const k of Object.keys(v)) {
      const child = v[k]
      if (child && typeof child === 'object') queue.push({ v: child, depth: depth + 1 })
    }
  }

  return null
}

function normalizeCitizen(citizen) {
  if (!citizen || typeof citizen !== 'object') return null

  // map key ที่อาจต่างชื่อ
  const citizenId =
    citizen.citizenId ||
    citizen.CitizenID ||
    citizen.citizen_id ||
    citizen.CITIZEN_ID ||
    null

  return {
    userId: citizen.userId ?? citizen.UserId ?? citizen.user_id ?? citizen.USER_ID ?? null,
    citizenId: citizenId,
    firstName: citizen.firstName ?? citizen.FirstName ?? citizen.first_name ?? null,
    lastName: citizen.lastName ?? citizen.LastName ?? citizen.last_name ?? null,
    dateOfBirthString: citizen.dateOfBirthString ?? citizen.dateOfBirth ?? citizen.birthDate ?? null,
    mobile: citizen.mobile ?? citizen.phone ?? citizen.Mobile ?? null,
    email: citizen.email ?? citizen.Email ?? null,
    notification: citizen.notification ?? citizen.Notification ?? null,
    _raw: citizen,
  }
}

/* ----------------------- notification helpers ----------------------- */
function toSendDateTime(dt = new Date()) {
  return dt instanceof Date ? dt.toISOString() : String(dt)
}

async function sendNotification({ token, consumerKey, appId, userId, message, sendDateTime }) {
  const url =
    process.env.NOTIFICATION_API_URL ||
    'https://api.egov.go.th/ws/dga/czp/uat/v1/core/notification/push'

  const body = {
    appId,
    data: [{ message: message || 'Login successful', userId }],
    sendDateTime: sendDateTime || toSendDateTime(new Date()),
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Consumer-Key': consumerKey,
      Token: token,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  const { json, text } = await readResp(resp)
  if (!resp.ok) throw new Error(`Notification failed: ${resp.status} ${JSON.stringify(json || text)}`)
  return json
}

/* ----------------------------- handler ----------------------------- */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { appId, mToken, mode } = req.body || {}
  if (!appId || !mToken) return res.status(400).json({ error: 'appId and mToken are required' })

  const consumerKey = process.env.EGOV_CONSUMER_KEY
  const consumerSecret = process.env.EGOV_CONSUMER_SECRET
  const agentId = process.env.EGOV_AGENT_ID

  if (!consumerKey || !consumerSecret || !agentId) {
    return res.status(500).json({
      status: 'error',
      step: 'env',
      message: 'Missing EGOV env (EGOV_CONSUMER_KEY / EGOV_CONSUMER_SECRET / EGOV_AGENT_ID)',
    })
  }

  const debugInfo = {
    mode: mode || 'login',
    validateToken: null,
    deprocContentType: null,
    deprocRaw: null,
    notificationError: null,
  }

  try {
    // 1) validate token
    const validateUrl =
      `https://api.egov.go.th/ws/auth/validate` +
      `?ConsumerSecret=${encodeURIComponent(consumerSecret)}` +
      `&AgentID=${encodeURIComponent(agentId)}`

    const validateResp = await fetch(validateUrl, {
      method: 'GET',
      headers: { 'Consumer-Key': consumerKey, Accept: 'application/json' },
    })

    const validateBody = await readResp(validateResp)
    if (!validateResp.ok) {
      return res.status(502).json({
        status: 'error',
        step: 'validate',
        httpStatus: validateResp.status,
        error: validateBody.json ?? validateBody.text ?? null,
      })
    }

    const token = pickToken(validateBody.json)
    if (!token) {
      return res.status(500).json({
        status: 'error',
        step: 'validate',
        message: 'Token not found',
        raw: validateBody.json ?? validateBody.text ?? null,
      })
    }

    debugInfo.validateToken = maskToken(token)

    // 2) deproc
    const deprocUrl =
      process.env.DEPROC_API_URL ||
      'https://api.egov.go.th/ws/dga/czp/uat/v1/core/shield/data/deproc'

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
    debugInfo.deprocContentType = deprocBody.contentType
    debugInfo.deprocRaw = deprocBody.json ?? deprocBody.text // ✅ ส่ง raw กลับให้ดู

    if (!deprocResp.ok) {
      return res.status(502).json({
        status: 'error',
        step: 'deproc',
        httpStatus: deprocResp.status,
        contentType: deprocBody.contentType,
        error: deprocBody.json ?? deprocBody.text ?? null,
        debug: debugInfo,
      })
    }

    // ✅ deep find citizen
    const foundCitizen = deepFindCitizen(deprocBody.json || deprocBody.text)
    const citizen = normalizeCitizen(foundCitizen)

    if (!citizen || !citizen.citizenId) {
      // ❗ตรงนี้คือ error ที่คุณเจอ
      return res.status(500).json({
        status: 'error',
        step: 'deproc_parse',
        message: 'Deproc returned NULL / citizenId not found',
        debug: debugInfo, // ✅ จะเห็น deprocRaw ว่ามันส่งอะไรมาจริง
      })
    }

    // 3) DB connect
    await connectToDatabase()

    // ✅ check mode: ไม่เขียน DB
    if (mode === 'check') {
      const existing = await User.findOne({ citizenId: citizen.citizenId }).lean()
      if (existing) {
        return res.status(200).json({
          found: true,
          mode: 'check',
          data: {
            citizenId: existing.citizenId,
            userId: existing.userId,
            firstName: existing.firstName,
            lastName: existing.lastName,
            appId: existing.appId ?? appId,
          },
        })
      }

      return res.status(200).json({
        found: false,
        mode: 'check',
        appId,
        deproc: {
          citizenId: citizen.citizenId,
          firstName: citizen.firstName,
          lastName: citizen.lastName,
          userId: citizen.userId,
        },
      })
    }

    // ✅ login mode: upsert DB
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

    await User.findOneAndUpdate(
      { citizenId: saved.citizenId },
      {
        $set: { ...saved, appId, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true }
    )

    // ✅ ส่ง noti หลังบันทึก DB (ถ้าพังไม่ทำให้ login ล้ม)
    let notiResult = null
    try {
      if (saved.userId) {
        notiResult = await sendNotification({
          token,
          consumerKey,
          appId,
          userId: saved.userId,
          message: `ยืนยันตัวตนสำเร็จ: ${(saved.firstName || '')} ${(saved.lastName || '')}`.trim(),
          sendDateTime: toSendDateTime(new Date()),
        })
      } else {
        debugInfo.notificationError = 'skip noti: missing userId'
      }
    } catch (e) {
      debugInfo.notificationError = String(e?.message || e)
    }

    return res.status(200).json({
      status: 'success',
      mode: 'login',
      message: 'Login successful',
      data: {
        firstName: saved.firstName,
        lastName: saved.lastName,
        citizenId: saved.citizenId,
        userId: saved.userId,
        appId,
      },
      notification: notiResult,
      debug: debugInfo,
    })
  } catch (err) {
    console.error('API /api/egov ERROR:', err)
    return res.status(500).json({
      status: 'error',
      step: 'catch',
      message: err?.message || 'Unexpected error',
      debug: debugInfo,
      stack: process.env.NODE_ENV === 'development' ? String(err?.stack || '') : undefined,
    })
  }
}
