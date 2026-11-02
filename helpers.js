export const BOOK_CATEGORIES = [
  "Fiction",
  "Science",
  "History",
  "Kids",
  "Others",
];

export const BORROW_DAYS = 7;

export function sendResponse(res, status, success, message, data, errors) {
  const body = { success, message };

  if (data !== undefined) {
    body.data = data;
  }

  if (errors !== undefined) {
    body.errors = errors;
  }

  return res.status(status).json(body);
}

export function isValidId(id) {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}

export function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function validateBook(body, partial = false) {
  const input = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const data = {};
  const errors = [];
  const fields = ["title", "author", "category", "image", "description", "totalCopies"];

  for (const field of fields) {
    if (Object.hasOwn(input, field)) {
      data[field] = input[field];
    }
  }

  if (Object.hasOwn(data, "title")) {
    if (typeof data.title !== "string" || data.title.trim().length < 3) {
      errors.push("Title must be at least 3 characters.");
    } else if (data.title.trim().length > 120) {
      errors.push("Title must be at most 120 characters.");
    } else {
      data.title = data.title.trim();
    }
  } else if (!partial) {
    errors.push("Title is required.");
  }

  if (Object.hasOwn(data, "author")) {
    if (typeof data.author !== "string" || data.author.trim().length < 2) {
      errors.push("Author must be at least 2 characters.");
    } else if (data.author.trim().length > 100) {
      errors.push("Author must be at most 100 characters.");
    } else {
      data.author = data.author.trim();
    }
  } else if (!partial) {
    errors.push("Author is required.");
  }

  if (Object.hasOwn(data, "category")) {
    if (typeof data.category !== "string" || !BOOK_CATEGORIES.includes(data.category.trim())) {
      errors.push("Category is invalid.");
    } else {
      data.category = data.category.trim();
    }
  } else if (!partial) {
    errors.push("Category is required.");
  }

  if (Object.hasOwn(data, "image")) {
    const image = typeof data.image === "string" ? data.image.trim() : "";
    try {
      const url = new URL(image);
      if (!image || (url.protocol !== "http:" && url.protocol !== "https:")) {
        errors.push("Image must be a valid http or https URL.");
      } else {
        data.image = image;
      }
    } catch {
      errors.push("Image must be a valid http or https URL.");
    }
  } else if (!partial) {
    errors.push("Image is required.");
  }

  if (Object.hasOwn(data, "description")) {
    if (
      typeof data.description !== "string" ||
      data.description.trim().length < 10
    ) {
      errors.push("Description must be at least 10 characters.");
    } else if (data.description.trim().length > 1000) {
      errors.push("Description must be at most 1000 characters.");
    } else {
      data.description = data.description.trim();
    }
  } else if (!partial) {
    errors.push("Description is required.");
  }

  if (Object.hasOwn(data, "totalCopies")) {
    let copies = data.totalCopies;

    // Accept a whole-number string such as "3" (form inputs send strings).
    if (typeof copies === "string" && /^\d+$/.test(copies.trim())) {
      copies = Number(copies.trim());
    }

    if (!Number.isInteger(copies) || copies < 1 || copies > 1000) {
      errors.push("Total copies must be an integer from 1 to 1000.");
    } else {
      data.totalCopies = copies;
    }
  } else if (!partial) {
    errors.push("Total copies is required.");
  }

  return { data, errors };
}