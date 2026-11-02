import { Router } from "express";
import { ObjectId } from "mongodb";

import { getBooks, getBorrows } from "../db.js";
import { verifyJWT } from "../verifyJwt.js";
import { BORROW_DAYS, isValidId, sendResponse } from "../helpers.js";

const router = Router();

router.post("/borrows", verifyJWT, async (req, res, next) => {
  try {
    if (!isValidId(req.body?.bookId)) {
      return sendResponse(res, 400, false, "Invalid book id.");
    }

    const bookId = new ObjectId(req.body.bookId);
    const book = await getBooks().findOne({ _id: bookId });
    if (!book) {
      return sendResponse(res, 404, false, "Book not found.");
    }

    const borrowDate = new Date();
    const borrow = {
      bookId,
      bookTitle: book.title,
      bookImage: book.image,
      userEmail: req.user.email.toLowerCase(),
      userName: req.user.name,
      borrowDate,
      returnDate: new Date(borrowDate.getTime() + BORROW_DAYS * 24 * 60 * 60 * 1000),
    };

    let result;
    try {
      result = await getBorrows().insertOne(borrow);
    } catch (error) {
      if (error?.code === 11000) {
        return sendResponse(res, 409, false, "You have already borrowed this book.");
      }
      throw error;
    }
    borrow._id = result.insertedId;

    let update;
    try {
      update = await getBooks().updateOne(
        { _id: bookId, availableCopies: { $gt: 0 } },
        { $inc: { availableCopies: -1 } },
      );
    } catch (error) {
      // Copies were not decreased, so undo the borrow record.
      await getBorrows().deleteOne({ _id: result.insertedId });
      throw error;
    }

    if (update.matchedCount === 0) {
      await getBorrows().deleteOne({ _id: result.insertedId });
      return sendResponse(res, 409, false, "This book is not available right now.");
    }

    return sendResponse(res, 201, true, "Book borrowed successfully.", borrow);
  } catch (error) {
    return next(error);
  }
});

router.get("/borrows", verifyJWT, async (req, res, next) => {
  try {
    const borrows = await getBorrows()
      .find({ userEmail: req.user.email.toLowerCase() })
      .sort({ borrowDate: -1 })
      .toArray();

    return sendResponse(res, 200, true, "Borrows fetched successfully.", borrows);
  } catch (error) {
    return next(error);
  }
});

router.delete("/borrows/:id", verifyJWT, async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendResponse(res, 400, false, "Invalid borrow id.");
    }

    const borrowId = new ObjectId(req.params.id);
    const borrow = await getBorrows().findOne({ _id: borrowId });
    if (!borrow) {
      return sendResponse(res, 404, false, "Borrow not found.");
    }

    if (borrow.userEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return sendResponse(res, 403, false, "You can only return your own borrows.");
    }

    const deleted = await getBorrows().deleteOne({ _id: borrowId });

    // Only give the copy back if this request really removed the borrow.
    if (deleted.deletedCount === 1) {
      await getBooks().updateOne(
        { _id: borrow.bookId },
        { $inc: { availableCopies: 1 } },
      );
    }

    return sendResponse(res, 200, true, "Book returned successfully.");
  } catch (error) {
    return next(error);
  }
});

export default router;