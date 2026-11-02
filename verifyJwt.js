import "dotenv/config";

import { createRemoteJWKSet, jwtVerify } from "jose";

import { sendResponse } from "./helpers.js";

const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/+$/, "");
const JWKS = createRemoteJWKSet(
  new URL(process.env.JWKS_URL || `${CLIENT_URL}/api/auth/jwks`),
);

export async function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return sendResponse(res, 401, false, "Please log in to continue.");
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, { maxTokenAge: "7d" });

    if (!payload.email) {
      return sendResponse(res, 401, false, "Please log in to continue.");
    }

    req.user = {
      id: payload.id || payload.sub,
      email: payload.email,
      name: payload.name || "",
      image: payload.image,
    };
    next();
  } catch (error) {
    console.warn("JWT verification failed:", error?.code || error?.name);

    if (error?.code === "ERR_JWT_EXPIRED") {
      return sendResponse(res, 401, false, "Your session has expired.");
    }
    return sendResponse(res, 401, false, "Please log in to continue.");
  }
}

export function notFound(req, res) {
  return sendResponse(res, 404, false, "Route not found.");
}

export function errorHandler(err, req, res, next) {
  if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return sendResponse(res, 400, false, "Invalid JSON body.");
  }
  console.error(err);
  return sendResponse(res, 500, false, "Something went wrong on the server.");
}