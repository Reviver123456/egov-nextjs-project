
import connectToDatabase from '../lib/db'
import User from '../models/User'

export async function saveUser(data: any) {
  await connectToDatabase()
  await User.findOneAndUpdate(
    { citizenId: data.citizenId },
    { $set: data },
    { upsert: true }
  )
}

export async function getUserProfile() {
  await connectToDatabase()
  return User.findOne().lean()
}
