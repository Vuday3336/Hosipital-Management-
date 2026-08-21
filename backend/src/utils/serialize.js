// Safe to nest via `include: { user: { select: publicUserSelect } }` — Prisma has
// no Mongoose-style schema-level `select: false`, so every relation that pulls in
// a User must explicitly exclude passwordHash/reset-token fields like this one does.
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
};

// Reshapes Prisma results back into the exact JSON contract the (unchanged)
// frontend already expects from the old Mongoose responses: `_id` instead of
// `id`, and a relation field that is either the bare foreign-key id string
// (not included) or the full nested object (included) — never both a
// "doctorId" and a "doctor" key side by side, the way raw Prisma returns it.
//
// Relies on every relation in schema.prisma following the `<name>Id` scalar /
// `<name>` relation naming convention, which every model in this schema does.
const isPlainObject = (value) => value !== null && typeof value === "object" && value.constructor === Object;

export const serialize = (value) => {
  if (Array.isArray(value)) return value.map(serialize);
  if (!isPlainObject(value)) return value;

  const relationKeys = new Set(Object.keys(value).filter((k) => k.endsWith("Id") && k.slice(0, -2) in value));

  const out = {};
  for (const [key, raw] of Object.entries(value)) {
    if (key === "id") {
      out._id = raw;
      continue;
    }
    if (relationKeys.has(key)) continue; // drop the raw FK scalar — the relation object below carries it
    if (key.endsWith("Id") && !(key.slice(0, -2) in value)) {
      out[key.slice(0, -2)] = raw; // not included — expose as a bare id string under the relation's name
      continue;
    }
    out[key] = serialize(raw);
  }
  return out;
};
