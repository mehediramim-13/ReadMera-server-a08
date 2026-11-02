import "dotenv/config";

import { MongoClient } from "mongodb";

let client = null;
let db = null;
let connectionPromise = null;
let indexesCreated = false;

export async function connectDB() {
  if (db && indexesCreated) {
    return db;
  }

  if (!connectionPromise) {
    connectionPromise = (async () => {
      if (!client) {
        client = new MongoClient(process.env.MONGODB_URL);
      }

      await client.connect();
      db = client.db(process.env.DB_NAME);

      if (!indexesCreated) {
        const books = db.collection("books");
        const borrows = db.collection("borrows");

        await books.createIndex({ createdAt: -1 });
        await books.createIndex({ userEmail: 1 });
        await borrows.createIndex({ bookId: 1, userEmail: 1 }, { unique: true });

        indexesCreated = true;
      }

      return db;
    })().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  return connectionPromise;
}

export function getDb() {
  if (!db) {
    throw new Error("Database is not connected.");
  }

  return db;
}

export function getBooks() {
  return getDb().collection("books");
}

export function getBorrows() {
  return getDb().collection("borrows");
}
