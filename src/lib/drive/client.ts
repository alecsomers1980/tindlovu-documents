import { google } from 'googleapis'
import type { drive_v3 } from 'googleapis'

let _drive: drive_v3.Drive | null = null

export function getDriveClient(): drive_v3.Drive {
  if (_drive) return _drive

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN

  if (!clientId) throw new Error('Missing env variable: GOOGLE_OAUTH_CLIENT_ID')
  if (!clientSecret) throw new Error('Missing env variable: GOOGLE_OAUTH_CLIENT_SECRET')
  if (!refreshToken) throw new Error('Missing env variable: GOOGLE_OAUTH_REFRESH_TOKEN')

  const auth = new google.auth.OAuth2(clientId, clientSecret)
  auth.setCredentials({ refresh_token: refreshToken })

  _drive = google.drive({ version: 'v3', auth })
  return _drive
}
