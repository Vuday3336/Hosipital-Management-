import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const adminOverview = asyncHandler(async (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    totalPatients,
    totalDoctors,
    appointmentsByStatus,
    admittedCount,
    allMedicines,
    revenueByMonth,
    appointmentsByDeptRaw,
    departments,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.doctor.count(),
    prisma.appointment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.admission.count({ where: { status: "admitted" } }),
    prisma.medicine.findMany({ select: { stockQuantity: true, reorderLevel: true } }),
    // Postgres date_trunc groups months in a single query — no clean equivalent
    // via Prisma's groupBy (it can't group by a truncated/derived expression).
    prisma.$queryRaw`
      SELECT date_trunc('month', "createdAt") AS month, SUM("paidAmount")::float AS revenue, SUM("totalAmount")::float AS billed
      FROM "Invoice"
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY month
      ORDER BY month ASC
    `,
    prisma.appointment.groupBy({ by: ["departmentId"], _count: { _all: true } }),
    prisma.department.findMany({ select: { id: true, name: true } }),
  ]);

  const lowStockCount = allMedicines.filter((m) => m.stockQuantity <= m.reorderLevel).length;
  const deptNameById = new Map(departments.map((d) => [d.id, d.name]));

  sendSuccess(res, {
    data: {
      totals: { patients: totalPatients, doctors: totalDoctors, admitted: admittedCount, lowStockMedicines: lowStockCount },
      appointmentsByStatus: appointmentsByStatus.map((s) => ({ status: s.status, count: s._count._all })),
      appointmentsByDepartment: appointmentsByDeptRaw
        .map((d) => ({ department: deptNameById.get(d.departmentId) || "Unknown", count: d._count._all }))
        .sort((a, b) => b.count - a.count),
      revenueByMonth: revenueByMonth.map((r) => ({
        label: `${r.month.getUTCFullYear()}-${String(r.month.getUTCMonth() + 1).padStart(2, "0")}`,
        revenue: r.revenue || 0,
        billed: r.billed || 0,
      })),
    },
  });
});

export const doctorOverview = asyncHandler(async (req, res) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
  if (!doctor) throw ApiError.forbidden("No doctor profile linked to this account");

  const today = new Date().toISOString().slice(0, 10);

  const [appointmentsByStatus, upcomingCount, uniquePatients, appointmentsLast30Days] = await Promise.all([
    prisma.appointment.groupBy({ by: ["status"], where: { doctorId: doctor.id }, _count: { _all: true } }),
    prisma.appointment.count({
      where: { doctorId: doctor.id, date: { gte: today }, status: { in: ["pending", "confirmed"] } },
    }),
    prisma.appointment.groupBy({ by: ["patientId"], where: { doctorId: doctor.id } }),
    prisma.appointment.groupBy({
      by: ["date"],
      where: { doctorId: doctor.id },
      _count: { _all: true },
      orderBy: { date: "desc" },
      take: 30,
    }),
  ]);

  sendSuccess(res, {
    data: {
      totals: { uniquePatients: uniquePatients.length, upcomingAppointments: upcomingCount },
      appointmentsByStatus: appointmentsByStatus.map((s) => ({ status: s.status, count: s._count._all })),
      appointmentsByDay: appointmentsLast30Days.map((d) => ({ date: d.date, count: d._count._all })).reverse(),
    },
  });
});
