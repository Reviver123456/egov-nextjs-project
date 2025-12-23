
import { NextResponse } from 'next/server'
import { loginWithEgov } from '@/services/egovService'

export async function POST(req: Request) {
  const body = await req.json()
  const result = await loginWithEgov(body)
  return NextResponse.json(result)
}
