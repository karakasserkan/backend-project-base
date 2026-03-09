const express = require("express");
const router = express.Router();
const Response = require("../lib/Response");
const AuditLogs = require("../db/models/AuditLogs");
const Categories = require("../db/models/Categories");
const Users = require("../db/models/Users");
const auth = require("../lib/auth")();
const asyncHandler = require("../lib/asyncHandler");

router.use(auth.authenticate()); // FIX: router.all("*") yerine router.use()

// 1. Audit logs — kim hangi işlemi kaç kez yaptı
router.get(
  "/auditlogs",
  auth.checkRoles("auditlogs_view"),
  asyncHandler(async (req, res) => {
    const body = req.body;
    const filter = {};
    if (typeof body.location === "string") filter.location = body.location;

    const result = await AuditLogs.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { email: "$email", proc_type: "$proc_type" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json(Response.successResponse(result));
  }),
);

// 2. Kategorilerdeki tekil veri sayısı
router.get(
  "/categories/unique",
  auth.checkRoles("category_view"),
  asyncHandler(async (req, res) => {
    const body = req.body;
    const filter = {};
    if (typeof body.is_active === "boolean") filter.is_active = body.is_active;

    const result = await Categories.distinct("name", filter);
    res.json(Response.successResponse({ result, count: result.length }));
  }),
);

// 3. Sistemdeki kullanıcı sayısı
router.get(
  "/users/count",
  auth.checkRoles("user_view"),
  asyncHandler(async (req, res) => {
    const body = req.body;
    const filter = {};
    if (typeof body.is_active === "boolean") filter.is_active = body.is_active;

    const result = await Users.countDocuments(filter);
    res.json(Response.successResponse({ count: result }));
  }),
);

module.exports = router;
