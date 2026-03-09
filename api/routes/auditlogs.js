const express = require("express");
const router = express.Router();
const Response = require("../lib/Response");
const AuditLogs = require("../db/models/AuditLogs");
const moment = require("moment");
const auth = require("../lib/auth")();
const asyncHandler = require("../lib/asyncHandler");

router.use(auth.authenticate());

router.post(
  "/",
  auth.checkRoles("auditlogs_view"),
  asyncHandler(async (req, res) => {
    const body = req.body;
    const query = {};

    // FIX: Daha temiz skip/limit tanımı
    const skip =
      typeof body.skip === "number" && body.skip >= 0 ? body.skip : 0;
    const limit =
      typeof body.limit === "number" && body.limit <= 500 ? body.limit : 500;

    if (body.begin_date && body.end_date) {
      query.created_at = {
        $gte: moment(body.begin_date),
        $lte: moment(body.end_date),
      };
    } else {
      query.created_at = {
        $gte: moment().subtract(1, "day").startOf("day"),
        $lte: moment(),
      };
    }

    const auditLogs = await AuditLogs.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    res.json(Response.successResponse(auditLogs));
  }),
);

module.exports = router;
