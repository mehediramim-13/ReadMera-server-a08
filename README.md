# BookNook Server

Backend REST API for **BookNook**, a small online library. Authentication is handled by Better Auth on the client; this API verifies the JWT in the `Authorization` header.

## Tech Stack

- Node.js + Express 5
- MongoDB (native driver, no Mongoose)
- JWT verification with `jose` (JWKS)
- CORS, dotenv

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set the required backend values:

   ```bash
   cp .env.example .env
   ```

3. Start locally:

   ```bash
   npm run dev
   ```

   The API starts on `http://localhost:5000` (or the configured `PORT`).

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Local server port. |
| `MONGODB_URL` | MongoDB connection string. |
| `DB_NAME` | MongoDB database name. |
| `CLIENT_URL` | Allowed frontend origin for CORS. |
| `JWKS_URL` | Better Auth client's JWKS endpoint. |
| `APP_TIMEZONE` | Timezone used to determine today's date. |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID for the Next.js client; not used by this API. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret for the Next.js client; not used by this API. |
| `BETTER_AUTH_URL` | Better Auth URL for the Next.js client; not used by this API. |
| `BETTER_AUTH_SECRET` | Better Auth secret for the Next.js client; not used by this API. |

## API Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Health check |
| GET | `/api/books` | Public | List books (`limit`, `category`, `search`, `userEmail`) |
| GET | `/api/books/:id` | Bearer JWT | Get one book |
| POST | `/api/books` | Bearer JWT | Add a book |
| PATCH | `/api/books/:id` | Bearer JWT, owner | Update a book |
| DELETE | `/api/books/:id` | Bearer JWT, owner | Delete a book and its borrows |
| POST | `/api/borrows` | Bearer JWT | Borrow a book |
| GET | `/api/borrows` | Bearer JWT | List the logged-in user's borrows |
| DELETE | `/api/borrows/:id` | Bearer JWT, borrower | Return a book |

Books use the fields `title`, `author`, `category`, `image`, `description`, and `totalCopies`. Book owner and borrower identity are taken from the verified JWT, not the request body. Borrow periods are seven days. Responses use `{ success, message, data?, errors? }`.
