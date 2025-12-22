import connectToDatabase from '../../lib/db'
import User from '../../models/User'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await connectToDatabase()

    // ตัวอย่าง: เอาคนล่าสุด (ตาม updatedAt) — คุณปรับ logic ได้
    const user = await User.findOne({}).sort({ updatedAt: -1 }).lean()

    if (!user) {
      return res.status(200).json({ status: 'success', data: null })
    }

    return res.status(200).json({
      status: 'success',
      data: {
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        citizenId: user.citizenId || null,
        userId: user.userId || null,
        appId: user.appId || null,
      },
    })
  } catch (e) {
    return res.status(500).json({ status: 'error', message: e?.message || 'Unexpected error' })
  }
}
