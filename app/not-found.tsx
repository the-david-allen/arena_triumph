import Link from 'next/link'

export const runtime = 'edge'

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 200px)',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', margin: '0 0 1rem 0' }}>404</h1>
        <p style={{ fontSize: '1.25rem', margin: '0 0 2rem 0' }}>Page Not Found</p>
        <Link
          href="/"
          style={{
            color: '#2563eb',
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: '500',
          }}
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
