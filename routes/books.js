import { Router } from "express";
import { ObjectId } from "mongodb";

import { getBooks, getBorrows } from "../db.js";
import { verifyJWT } from "../verifyJwt.js";
import {
  BOOK_CATEGORIES,
  escapeRegex,
  isValidId,
  sendResponse,
  validateBook,
} from "../helpers.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    const { limit, category, search, userEmail } = req.query;

    if (limit !== undefined) {
      const count = Number(limit);
      if (!Number.isInteger(count) || count < 1 || count > 50) {
        return sendResponse(res, 400, false, "Limit must be an integer from 1 to 50.");
      }
    }

    if (category !== undefined) {
      if (typeof category !== "string" || !BOOK_CATEGORIES.includes(category)) {
        return sendResponse(res, 400, false, "Category is invalid.");
      }
      filter.category = category;
    }

    if (typeof search === "string" && search.trim()) {
      const safe = escapeRegex(search.trim());
      filter.$or = [
        { title: { $regex: safe, $options: "i" } },
        { author: { $regex: safe, $options: "i" } },
      ];
    }

    if (typeof userEmail === "string") {
      filter.userEmail = userEmail.toLowerCase();
    }

    let query = getBooks().find(filter).sort({ createdAt: -1 });
    if (limit !== undefined) {
      query = query.limit(Number(limit));
    }

    const books = await query.toArray();
    return sendResponse(res, 200, true, "Books fetched successfully.", books);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", verifyJWT, async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendResponse(res, 400, false, "Invalid book id.");
    }

    const book = await getBooks().findOne({ _id: new ObjectId(req.params.id) });
    if (!book) {
      return sendResponse(res, 404, false, "Book not found.");
    }

    return sendResponse(res, 200, true, "Book fetched successfully.", book);
  } catch (error) {
    return next(error);
  }
});

router.post("/", verifyJWT, async (req, res, next) => {
  try {
    const { data, errors } = validateBook(req.body);
    if (errors.length > 0) {
      return sendResponse(
        res,
        400,
        false,
        "Please fix the highlighted fields.",
        undefined,
        errors,
      );
    }

    const book = {
      ...data,
      availableCopies: data.totalCopies,
      userName: req.user.name || req.user.email,
      userEmail: req.user.email.toLowerCase(),
      createdAt: new Date(),
    };

    const result = await getBooks().insertOne(book);
    book._id = result.insertedId;

    return sendResponse(res, 201, true, "Book created successfully.", book);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", verifyJWT, async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendResponse(res, 400, false, "Invalid book id.");
    }

    const bookId = new ObjectId(req.params.id);
    const book = await getBooks().findOne({ _id: bookId });
    if (!book) {
      return sendResponse(res, 404, false, "Book not found.");
    }

    if (book.userEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return sendResponse(res, 403, false, "You can only update your own books.");
    }

    const { data, errors } = validateBook(req.body, true);
    if (Object.keys(data).length === 0) {
      errors.push("At least one book field must be provided.");
    }
    if (errors.length > 0) {
      return sendResponse(
        res,
        400,
        false,
        "Please fix the highlighted fields.",
        undefined,
        errors,
      );
    }

    const filter = { _id: bookId };

    if (Object.hasOwn(data, "totalCopies")) {
      const borrowed = book.totalCopies - book.availableCopies;
      if (data.totalCopies < borrowed) {
        return sendResponse(
          res,
          400,
          false,
          "Total copies cannot be less than the copies currently borrowed.",
        );
      }
      data.availableCopies = data.totalCopies - borrowed;

      // If someone borrows or returns while we edit, this filter will not match.
      filter.totalCopies = book.totalCopies;
      filter.availableCopies = book.availableCopies;
    }

    const update = await getBooks().updateOne(filter, { $set: data });
    if (update.matchedCount === 0) {
      return sendResponse(
        res,
        409,
        false,
        "This book was just borrowed or returned. Please try again.",
      );
    }

    // Borrows keep a copy of the title and image, so keep them in sync.
    const borrowSync = {};
    if (Object.hasOwn(data, "title")) borrowSync.bookTitle = data.title;
    if (Object.hasOwn(data, "image")) borrowSync.bookImage = data.image;
    if (Object.keys(borrowSync).length > 0) {
      await getBorrows().updateMany({ bookId }, { $set: borrowSync });
    }

    const updated = await getBooks().findOne({ _id: bookId });

    return sendResponse(res, 200, true, "Book updated successfully.", updated);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", verifyJWT, async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendResponse(res, 400, false, "Invalid book id.");
    }

    const bookId = new ObjectId(req.params.id);
    const book = await getBooks().findOne({ _id: bookId });
    if (!book) {
      return sendResponse(res, 404, false, "Book not found.");
    }

    if (book.userEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return sendResponse(res, 403, false, "You can only delete your own books.");
    }

    await getBooks().deleteOne({ _id: bookId });
    await getBorrows().deleteMany({ bookId });

    return sendResponse(res, 200, true, "Book deleted successfully.");
  } catch (error) {
    return next(error);
  }
});

export default router;