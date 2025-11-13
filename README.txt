Updated eGov API route (Next.js)

This version matches the Postman flow exactly:
1. GET /auth/validate -> Result (Token)
2. POST /data/mock -> result.mToken
3. POST /data/deproc -> final data

Required body parameters: consumerKey, consumerSecret, appid

Example POST body:
{
  "consumerKey": "YOUR_CONSUMER_KEY",
  "consumerSecret": "YOUR_CONSUMER_SECRET",
  "appid": "YOUR_APP_ID"
}
