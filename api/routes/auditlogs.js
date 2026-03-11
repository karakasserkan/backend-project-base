const express = require("express");
const router = express.Router();
const Response = require("../lib/Response");
const AuditLogs = require("../db/models/AuditLogs");
const moment = require("moment");
const auth = require("../lib/auth")();
const asyncHandler = require("../lib/asyncHandler");
const paginate = require("../lib/paginate");

//SWAGGER
/**
 * @swagger
 * tags:
 *   name: AuditLogs
 *   description: Sistem log kayıtları
 *
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         level:
 *           type: string
 *           enum: [info, warn, error, debug, verbose, http, silly]
 *         email:
 *           type: string
 *         location:
 *           type: string
 *         proc_type:
 *           type: string
 *         log:
 *           type: object
 *         created_at:
 *           type: string
 */

/**
 * @swagger
 * /auditlogs:
 *   post:
 *     summary: Log kayıtlarını filtrele ve listele
 *     tags: [AuditLogs]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               begin_date:
 *                 type: string
 *                 example: "2026-03-01"
 *               end_date:
 *                 type: string
 *                 example: "2026-03-11"
 *               skip:
 *                 type: number
 *                 example: 0
 *               limit:
 *                 type: number
 *                 example: 100
 *     responses:
 *       200:
 *         description: Log listesi
 *       401:
 *         description: Yetkisiz
 */

router.use(auth.authenticate());

// ─── PROTECTED ENDPOINTS
router.post(
  "/",
  auth.checkRoles("auditlogs_view"),
  asyncHandler(async (req, res) => {
    const body = req.body;
    const query = {};

    const page = Math.max(1, parseInt(body.page) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(body.limit) || 20));
    const skip = (page - 1) * limit;

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

    const [auditLogs, total] = await Promise.all([
      AuditLogs.find(query).sort({ created_at: -1 }).skip(skip).limit(limit),
      AuditLogs.countDocuments(query),
    ]);

    res.json(
      Response.successResponse({
        data: auditLogs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      }),
    );
  }),
);
module.exports = router;
