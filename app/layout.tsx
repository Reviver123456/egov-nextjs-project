
import '../styles/globals.css'

export const metadata = {
  title: 'eGov Production',
  description: 'eGov Production App',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
