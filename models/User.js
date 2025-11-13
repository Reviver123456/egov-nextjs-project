import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  citizenId: String,
  firstName: String,
  middleName: String,
  lastName: String,
  dateOfBirthString: String,
  mobile: String,
  email: String,
  notification: Boolean,
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.User || mongoose.model('User', UserSchema)
