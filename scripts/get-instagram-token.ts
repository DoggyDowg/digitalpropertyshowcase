import fetch from 'node-fetch'

const CLIENT_ID = 'YOUR_APP_ID' // From Meta Developer App Settings
const CLIENT_SECRET = 'YOUR_APP_SECRET' // From Meta Developer App Settings
const SHORT_LIVED_TOKEN = 'YOUR_SHORT_LIVED_TOKEN' // The token you got from step 2

interface InstagramTokenResponse {
  error?: {
    message: string
    type: string
    code: number
  }
  access_token: string
  expires_in: number
}

async function getLongLivedToken() {
  try {
    const response = await fetch(
      `https://graph.instagram.com/access_token?` +
      `grant_type=ig_exchange_token&` +
      `client_secret=${CLIENT_SECRET}&` +
      `access_token=${SHORT_LIVED_TOKEN}`
    )

    const data = await response.json() as InstagramTokenResponse

    if (data.error) {
      console.error('Error:', data.error.message)
      return
    }

    console.log('Success! Your long-lived token is:', data.access_token)
    console.log('Token expires in:', data.expires_in, 'seconds (approximately 60 days)')
    console.log('\nAdd this to your .env.local file:')
    console.log(`INSTAGRAM_ACCESS_TOKEN=${data.access_token}`)
  } catch (error) {
    console.error('Failed to get long-lived token:', error)
  }
}

getLongLivedToken() 