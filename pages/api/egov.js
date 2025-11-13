import connectToDatabase from '../../lib/db'
import User from '../../models/User'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { appId, mToken } = req.body || {}
  if (!appId || !mToken) return res.status(400).json({ error: 'appId and mToken are required in body' })

  const consumerKey = process.env.CONSUMER_KEY
  const consumerSecret = process.env.CONSUMER_SECRET
  if (!consumerKey || !consumerSecret) {
    return res.status(500).json({ error: 'Missing CONSUMER_KEY or CONSUMER_SECRET in environment' })
  }

  try {
    // Step 1: validate -> get Token
    const agentId = '8a816448-0207-45f4-8613-65b0ad80afd0'
    const validateUrl = `https://api.egov.go.th/ws/auth/validate?ConsumerSecret=${encodeURIComponent(
      consumerSecret
    )}&AgentID=${encodeURIComponent(agentId)}`
    const validateResp = await fetch(validateUrl, {
      method: 'GET',
      headers: { 'Consumer-Key': consumerKey, 'Content-Type': 'application/json' }
    })
    const validateJson = await validateResp.json().catch(() => null)
    if (!validateResp.ok)
      return res.status(502).json({ step: 'validate', ok: false, body: validateJson })
    const token = validateJson?.Result || validateJson?.result || validateJson?.Token
    if (!token)
      return res.status(502).json({ step: 'validate', ok: false, message: 'Token not found' })

    // Step 2: deproc (use mToken + appId from CZP SDK)
    const deprocUrl = 'https://api.egov.go.th/ws/dga/czp/uat/v1/core/shield/data/deproc'
    const deprocResp = await fetch(deprocUrl, {
      method: 'POST',
      headers: {
        'Consumer-Key': consumerKey,
        'Content-Type': 'application/json',
        'Token': token
      },
      body: JSON.stringify({ appId, mToken })
    })
    const deprocJson = await deprocResp.json().catch(() => null)
    if (!deprocResp.ok)
      return res.status(502).json({ step: 'deproc', ok: false, body: deprocJson })

    // Extract citizen object
    let citizen = deprocJson?.result || deprocJson?.data || deprocJson
    const fields = ['userId', 'citizenId', 'firstName', 'lastName', 'dateOfBirthString', 'mobile', 'email', 'notification']
    const hasExpected = citizen && fields.every(f => f in citizen)
    if (!hasExpected) return res.status(200).json({ message: 'Unexpected data', deprocJson })

    const doc = {
      userId: citizen.userId,
      citizenId: citizen.citizenId,
      firstName: citizen.firstName,
      middleName: citizen.middleName ?? null,
      lastName: citizen.lastName,
      dateOfBirthString: citizen.dateOfBirthString,
      mobile: citizen.mobile,
      email: citizen.email,
      notification: !!citizen.notification
    }

    // Step 3: Push notification
if (doc.notification) {
  const pushUrl = 'https://api.egov.go.th/ws/dga/czp/uat/v1/core/notification/push'
  const pushResp = await fetch(pushUrl, {
    method: 'POST',
    headers: {
      'Consumer-Key': consumerKey,
      'Content-Type': 'application/json',
      'Token': token
    },
    body: JSON.stringify({
      userId: doc.userId,
      title: 'แจ้งเตือนจากระบบ',
      message: `สวัสดี ${doc.firstName} ${doc.lastName}, นี่คือข้อความทดสอบ`
    })
  })
  let pushJson = null
  try {
    pushJson = await pushResp.json()
  } catch (err) {
    console.error('Failed to parse push response:', err)
  }

  console.log('Notification response:', pushJson)

  if (!pushResp.ok) {
    console.warn('Push notification failed', pushJson)
  }
}


    // Step 4: Save to MongoDB
    await connectToDatabase()
    const saved = await User.findOneAndUpdate({ userId: doc.userId }, doc, { upsert: true, new: true })

    res.status(200).json({ saved })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: String(err) })
  }
}
