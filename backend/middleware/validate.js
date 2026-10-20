const { z } = require("zod");

// ── Schemas ───────────────────────────────────────────────────────────────────

const documentSchema = z.object({
  title: z.string().optional().default(""),
  content: z
    .string({ error: "each document needs non-empty content" })
    .trim()
    .min(1, "each document needs non-empty content"),
  metadata: z.record(z.string(), z.unknown()).optional().default({})
});

const ingestSchema = z.object({
  documents: z
    .array(documentSchema, { error: "documents must be a non-empty array" })
    .min(1, "documents must be a non-empty array")
});

const searchSchema = z.object({
  query: z
    .string({ error: "query must be a non-empty string" })
    .trim()
    .min(1, "query must be a non-empty string"),
  limit: z.coerce
    .number()
    .int()
    .default(5)
    .transform((val) => Math.min(20, Math.max(1, val))),
  minScore: z.coerce.number().min(0).max(1).optional().default(0)
});

// ── Middleware factory ─────────────────────────────────────────────────────────

/**
 * Returns an Express middleware that validates req.body against the given Zod
 * schema. On success it replaces req.body with the parsed (and coerced/defaulted)
 * data before calling next(). On failure it responds with 400 immediately.
 *
 * @param {import("zod").ZodTypeAny} schema
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = result.error?.issues?.[0] || result.error?.errors?.[0];
      return res.status(400).json({ message: issue ? issue.message : "Validation error" });
    }
    req.body = result.data;
    return next();
  };
}

module.exports = { validate, ingestSchema, searchSchema };
