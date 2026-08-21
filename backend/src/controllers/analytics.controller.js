import { Patient } from "../models/Patient.js";
import { Doctor } from "../models/Doctor.js";
import { Appointment } from "../models/Appointment.js";
import { Admission } from "../models/Admission.js";
import { Invoice } from "../models/Invoice.js";
import { Medicine } from "../models/Medicine.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const adminOverview = asyncHandler(async (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const [
    totalPatients,
    totalDoctors,
    appointmentsByStatus,
    admittedCount,
    lowStockCount,
    revenueByMonth,
    appointmentsByDepartment,
  ] = await Promise.all([
    Patient.countDocuments(),
    Doctor.countDocuments(),
    Appointment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Admission.countDocuments({ status: "admitted" }),
    Medicine.countDocuments({ $expr: { $lte: ["$stockQuantity", "$reorderLevel"] } }),
    Invoice.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$paidAmount" },
          billed: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Appointment.aggregate([
      {
        $lookup: { from: "departments", localField: "department", foreignField: "_id", as: "dept" },
      },
      { $unwind: "$dept" },
      { $group: { _id: "$dept.name", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  sendSuccess(res, {
    data: {
      totals: { patients: totalPatients, doctors: totalDoctors, admitted: admittedCount, lowStockMedicines: lowStockCount },
      appointmentsByStatus: appointmentsByStatus.map((s) => ({ status: s._id, count: s.count })),
      appointmentsByDepartment: appointmentsByDepartment.map((d) => ({ department: d._id, count: d.count })),
      revenueByMonth: revenueByMonth.map((r) => ({
        label: `${r._id.year}-${String(r._id.month).padStart(2, "0")}`,
        revenue: r.revenue,
        billed: r.billed,
      })),
    },
  });
});

export const doctorOverview = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user.id });
  if (!doctor) throw ApiError.forbidden("No doctor profile linked to this account");

  const today = new Date().toISOString().slice(0, 10);

  const [appointmentsByStatus, upcomingCount, uniquePatients, appointmentsLast30Days] = await Promise.all([
    Appointment.aggregate([
      { $match: { doctor: doctor._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Appointment.countDocuments({ doctor: doctor._id, date: { $gte: today }, status: { $in: ["pending", "confirmed"] } }),
    Appointment.distinct("patient", { doctor: doctor._id }),
    Appointment.aggregate([
      { $match: { doctor: doctor._id } },
      { $group: { _id: "$date", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]),
  ]);

  sendSuccess(res, {
    data: {
      totals: { uniquePatients: uniquePatients.length, upcomingAppointments: upcomingCount },
      appointmentsByStatus: appointmentsByStatus.map((s) => ({ status: s._id, count: s.count })),
      appointmentsByDay: appointmentsLast30Days.map((d) => ({ date: d._id, count: d.count })).reverse(),
    },
  });
});
