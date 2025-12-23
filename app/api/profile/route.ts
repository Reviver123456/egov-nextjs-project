
import { NextResponse } from 'next/server'
import { getUserProfile } from '@/services/userService'

export async function GET() {
  const data = await getUserProfile()
  return NextResponse.json({ data })
}
