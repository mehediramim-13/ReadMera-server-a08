import "dotenv/config";

import express from "express";
import cors from "cors";

import { connectDB } from "./db.js";
import { notFound, errorHandler } from "./verifyJwt.js";
import bookRoutes from "./routes/books.js";
import borrowRoutes from "./routes/borrows.js";

const requiredEnv = ["MONGODB_URL", "DB_NAME"];
const missingEnv = requiredEnv.find((name) => !process.env[name]?.trim());

if (missingEnv) {
  throw new Error(`Missing required environment variable: ${missingEnv}`);
}

const app = express();

// Both the local and the deployed frontend are always allowed.
// CLIENT_URL from the environment is added too (if it is set).
const allowedOrigins = [
  "http://localhost:3000",
  "https://read-mera.vercel.app",
];

const envClientUrl = process.env.CLIENT_URL?.trim().replace(/\/+$/, "");
if (envClientUrl && !allowedOrigins.includes(envClientUrl)) {
  allowedOrigins.push(envClientUrl);
}

app.use(
  cors({
    origin(origin, callback) {
      // Allow tools like curl/Postman (no Origin header) and listed frontends.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn("CORS blocked origin:", origin, "| allowed:", allowedOrigins.join(", "));
      return callback(null, false);
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "ReadMera API is running." });
});

app.use("/api/books", bookRoutes);
app.use("/api", borrowRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ReadMera API is running.",
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;

if (!process.env.VERCEL) {
  const port = process.env.PORT || 8000;
  app.listen(port, () => {
    console.log(`ReadMera API is running on port ${port}.`);
  });
}