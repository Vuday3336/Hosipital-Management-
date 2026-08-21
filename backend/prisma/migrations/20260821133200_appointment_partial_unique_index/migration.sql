-- The double-booking guard: one doctor can hold only one active (pending/confirmed)
-- appointment per date+startTime. Prisma's schema DSL can't express a partial
-- index (the WHERE clause), so this is a hand-written migration — mirrors the
-- MongoDB partialFilterExpression this replaces.
CREATE UNIQUE INDEX "Appointment_doctorId_date_startTime_active_key"
  ON "Appointment" ("doctorId", "date", "startTime")
  WHERE "status" IN ('pending', 'confirmed');
