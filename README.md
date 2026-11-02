<div align="center">

# 📚 ReadMera Server

**The REST API behind ReadMera, a small online library.**

[![Live API](https://img.shields.io/badge/Live%20API-readmera--server--a08.vercel.app-15803d?logo=vercel&logoColor=white)](https://readmera-server-a08.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Native%20Driver-47a248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-jose%20(JWKS)-000000?logo=jsonwebtokens&logoColor=white)](https://github.com/panva/jose)

🌐 **Client live site:** [https://read-mera.vercel.app/](https://read-mera.vercel.app/)
&nbsp;|&nbsp;
💻 **Client repo:** [ReadMera-client-a08](https://github.com/mehediramim-13/ReadMera-client-a08)

</div>

---

## 📖 About

This is the backend for **ReadMera**, where readers add books, borrow available titles for a week, and return them when they're done. The client handles sign-in with Better Auth. This server never sees a password. It only checks the JWT sent in the `Authorization` header and then handles the book and borrow data in MongoDB.

## ✨ Features

- 🔐 **JWT-protected routes.** Tokens issued by Better Auth are verified with `jose` against the client's JWKS endpoint.
- 👤 **Trusted identity.** The book owner and the borrower always come from the verified token, never from the request body, so nobody can act as someone else.
- 📗 **Full book CRUD.** Add, read, update and delete books with title, author, category, image, description and total copies.
- 🧑‍💼 **Owner-only changes.** Only the person who added a book can edit or delete it, and deleting a book also removes its related borrow records.
- 🔎 **Flexible book listing.** The public books endpoint supports `limit`, `category`, `search` and `userEmail` query parameters. This powers New Arrivals, the catalogue filters and My Books.
- 📥 **Borrow and return system.** A borrow lasts seven days. Only the borrower can return a book, and copy counts stay in sync with every borrow and return.
- 🚫 **No double borrowing.** The same user can't borrow the same book twice at the same time.
- 🧾 **Consistent responses.** Every response uses the shape `{ success, message, data?, errors? }`, which keeps the client's error handling simple.
- 🌍 **CORS locked to the client.** Only the configured frontend origin is allowed.
- ❤️ **Health check endpoint** for quick uptime checks.
- ☁️ **Deployed on Vercel** as a serverless Express app.

## 🧰 Tech stack

| Area | Tools |
| --- | --- |
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB (native driver, no Mongoose) |
| Authentication | JWT verification with `jose` (JWKS), tokens issued by Better Auth |
| Other packages | CORS, dotenv |
| Hosting | Vercel |

## 🔗 API endpoints

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Health check |
| `GET` | `/api/books` | Public | List books (`limit`, `category`, `search`, `userEmail`) |
| `GET` | `/api/books/:id` | Bearer JWT | Get one book |
| `POST` | `/api/books` | Bearer JWT | Add a book |
| `PATCH` | `/api/books/:id` | Bearer JWT, owner | Update a book |
| `DELETE` | `/api/books/:id` | Bearer JWT, owner | Delete a book and its borrows |
| `POST` | `/api/borrows` | Bearer JWT | Borrow a book |
| `GET` | `/api/borrows` | Bearer JWT | List the logged-in user's borrows |
| `DELETE` | `/api/borrows/:id` | Bearer JWT, borrower | Return a book |

**Book fields:** `title`, `author`, `category`, `image`, `description`, `totalCopies`

**Authorization header for protected routes:**

```
Authorization: Bearer <your-jwt-token>
```

## 🚀 Getting started

### What you'll need

- Node.js and npm
- A MongoDB database (Atlas or local)
- The ReadMera client running, since it issues the JWTs and exposes the JWKS endpoint

### Run it locally

```bash
git clone https://github.com/mehediramim-13/ReadMera-server-a08.git
cd ReadMera-server-a08
npm install
cp .env.example .env
```

Fill in your values in `.env`, then start the server:

```bash
npm run dev
```

The API runs at `http://localhost:5000` (or whatever `PORT` you set).

## 🔑 Environment variables

| Variable | Description |
| --- | --- |
| `PORT` | Local server port |
| `MONGODB_URL` | MongoDB connection string |
| `DB_NAME` | MongoDB database name |
| `CLIENT_URL` | Allowed frontend origin for CORS |
| `JWKS_URL` | Better Auth client's JWKS endpoint |
| `APP_TIMEZONE` | Timezone used to work out today's date |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID for the Next.js client (not used by this API) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret for the Next.js client (not used by this API) |
| `BETTER_AUTH_URL` | Better Auth URL for the Next.js client (not used by this API) |
| `BETTER_AUTH_SECRET` | Better Auth secret for the Next.js client (not used by this API) |

> 🔒 Never commit your real `.env` file. Only `.env.example` belongs in the repo.

## 🗂️ Project structure

```
ReadMera-server-a08/
├── api/            Vercel serverless entry
├── routes/         Book and borrow route handlers
├── db.js           MongoDB connection
├── helpers.js      Shared helper functions
├── verifyJwt.js    JWT verification middleware
├── index.js        Express app setup
├── vercel.json     Vercel deployment config
└── .env.example    Example environment variables
```

---

<div align="center">

Made with ☕ by **MD Mehedi Hasan**

[GitHub](https://github.com/mehediramim-13) · [Client](https://github.com/mehediramim-13/ReadMera-client-a08) · [Live Site](https://read-mera.vercel.app/)

</div>
