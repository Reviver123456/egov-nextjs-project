import connectToDatabase from '../../lib/db'
import User from '../../models/User'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { appId, mToken } = req.body || {}
  if (!appId || !mToken) {
    return res.status(400).json({ error: 'appId and mToken are required in body' })
  }

  // อ่าน ENV
  const consumerKey = process.env.CONSUMER_KEY
  const consumerSecret = process.env.CONSUMER_SECRET
  const agentId = process.env.AGENT_ID

  if (!consumerKey || !consumerSecret || !agentId) {
    return res.status(500).json({
      error: 'Missing CONSUMER_KEY, CONSUMER_SECRET or AGENT_ID in environment'
    })
  }

  try {
    const deprocUrl =
      "https://api.egov.go.th/ws/dga/czp/uat/v1/core/shield/data/deproc"

    const deprocResp = await fetch(deprocUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Consumer-Key": consumerKey,
        "AgentID": agentId
      },
      body: JSON.stringify({
        AppID: appId,
        Token: mToken
      })
    })

    const deprocJson = await deprocResp.json()

    if (!deprocResp.ok) {
      return res.status(500).json({
        error: "DGA DeProc failed",
        details: deprocJson
      })
    }
    const doc = {
      userId: deprocJson?.user?.userId || null,
      citizenId: deprocJson?.user?.id || null,
      firstname: deprocJson?.user?.firstname || null,
      lastname: deprocJson?.user?.lastname || null,
      email: deprocJson?.user?.email || null,
      mobile: deprocJson?.user?.mobile || null,
      token: deprocJson?.token || null,
      mToken: deprocJson?.mToken || null,
      appId: deprocJson?.appId || null
    }

    await connectToDatabase()

    const saved = await User.findOneAndUpdate(
      { userId: doc.userId },
      doc,
      { upsert: true, new: true }
    )

    return res.status(200).json({
      success: true,
      data: saved
    })

  } catch (err) {
    console.error("ERROR:", err)
    return res.status(500).json({ error: String(err) })
  }
}
