import http from 'node:http'
import { OAuth2Client } from 'google-auth-library'

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET

if (!clientId || !clientSecret) {
  console.error('Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET.')
  console.error('Run: node --env-file=.env.local scripts/auth-drive.mjs')
  process.exit(1)
}

const PORT = 53682
const REDIRECT = `http://localhost:${PORT}`

const oauth2 = new OAuth2Client(clientId, clientSecret, REDIRECT)
const url = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive.file'],
})

console.log('\n=== Tindlovu Drive OAuth ===\n')
console.log('1. Open this URL in your browser:\n')
console.log(url)
console.log('\n2. Sign in with your personal Google account (the one with 2TB).')
console.log('3. Approve access. You will be redirected back to localhost.\n')

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url ?? '/', REDIRECT)
    const code = u.searchParams.get('code')
    const err = u.searchParams.get('error')
    if (err) {
      res.end('Auth error: ' + err)
      console.error('Auth error:', err)
      server.close()
      return
    }
    if (!code) {
      res.end('No code received.')
      return
    }
    const { tokens } = await oauth2.getToken(code)
    res.end('Success! You can close this tab and return to the terminal.')
    if (!tokens.refresh_token) {
      console.error('\nNo refresh_token returned. Revoke existing access at')
      console.error('https://myaccount.google.com/permissions and re-run.')
    } else {
      console.log('\n=== Refresh token (copy into .env.local) ===\n')
      console.log('GOOGLE_OAUTH_REFRESH_TOKEN=' + tokens.refresh_token)
      console.log('\nDone. You can close this window.')
    }
    setTimeout(() => server.close(), 200)
  } catch (e) {
    res.end('Error: ' + (e instanceof Error ? e.message : String(e)))
    console.error(e)
    server.close()
  }
})

server.listen(PORT, () => {
  console.log(`Waiting for redirect on ${REDIRECT} ...`)
})
