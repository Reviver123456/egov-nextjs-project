
import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  userId: String,
  citizenId: String,
  firstName: String,
  lastName: String,
  appId: String,
}, { timestamps: true })

export default mongoose.models.User || mongoose.model('User', UserSchema)
