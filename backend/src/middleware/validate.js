import { ApiError } from "../utils/ApiError.js";

// Validates req[part] against a Zod schema and replaces it with the parsed (typed, defaulted) value.
export const validate = (schema, part = "body") => (req, res, next) => {
  const result = schema.safeParse(req[part]);
  if (!result.success) {
    return next(
      ApiError.badRequest(
        "Validation failed",
        result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
      )
    );
  }
  req[part] = result.data;
  next();
};
