export const runtime = 'edge'

export default function NotFound() {
  return (
    <html>
      <body>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center' }}>
            <h1>404</h1>
            <p>Page Not Found</p>
            <a href="/">Return Home</a>
          </div>
        </div>
      </body>
    </html>
  )
}
