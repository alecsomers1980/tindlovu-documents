import { google } from 'googleapis'

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN
const existing = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID

if (!clientId || !clientSecret || !refreshToken) {
  console.error('Missing env. Run with: node --env-file=.env.local scripts/bootstrap-drive.mjs')
  process.exit(1)
}

if (existing) {
  console.log(`GOOGLE_DRIVE_ROOT_FOLDER_ID already set to ${existing}. Nothing to do.`)
  process.exit(0)
}

const auth = new google.auth.OAuth2(clientId, clientSecret)
auth.setCredentials({ refresh_token: refreshToken })
const drive = google.drive({ version: 'v3', auth })

const res = await drive.files.create({
  requestBody: {
    name: 'Tindlovu Documents',
    mimeType: 'application/vnd.google-apps.folder',
  },
  fields: 'id',
})

if (!res.data.id) {
  console.error('Drive did not return an id')
  process.exit(1)
}

console.log('\n=== Root folder created ===\n')
console.log('GOOGLE_DRIVE_ROOT_FOLDER_ID=' + res.data.id)
console.log('\nAdd that line to .env.local, then re-run the dev server.')
