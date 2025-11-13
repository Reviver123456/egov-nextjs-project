eGov Next.js + MongoDB (Docker)
==================================

How to run (requires Docker & docker-compose):
1. Copy .env.example -> .env and fill values if desired.
2. docker-compose up --build
3. Visit http://localhost:3000

Notes:
- MongoDB database: egovdb
- Collection: users
- API route /api/egov expects POST body JSON:
  { "consumerKey": "...", "consumerSecret": "...", "appid": "..." }
- The API will run the 3-step flow (validate -> mock -> deproc), extract the citizen object,
  save it into MongoDB (collection users) and return the saved record.

Environment variables in docker-compose (you can override with .env):
- MONGODB_URI (default mongodb://mongo:27017/egovdb)
- NODE_ENV=production
- PORT=3000
