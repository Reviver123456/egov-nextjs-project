
'use client'
import { useEffect, useState } from 'react'

type User = { firstName: string; lastName: string }

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(j => setUser(j.data))
  }, [])

  return <div>{user ? `${user.firstName} ${user.lastName}` : 'Loading...'}</div>
}
