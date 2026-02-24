const express = require("express");
const router = express.Router();
const Categories = require("../db/models/Categories");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const AuditLogs = require("../lib/AuditLogs");
const logger = require("../lib/logger/LoggerClass");
const auth = require("../lib/auth")();

/**
 * CRUD
 * - Create: POST /categories
 * - Read: GET /categories
 * - Update: PUT /categories/:id
 * - Delete: DELETE /categories/:id
 */

router.all("*", auth.authenticate(), (req, res, next) => {
  next();
});

/* GET categories listing. */
router.get("/", async (req, res, next) => {
  try {
    // Select sorgusu yazılan kısım.

    let categories = await Categories.find({});

    res.json(Response.successResponse(categories));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(Response.errorResponse(err));
  }
});

// ADD ENDPOINT
router.post("/add", async (req, res, next) => {
  let body = req.body;
  try {
    if (!body.name)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Name is required",
        "Name field is missing in the request body",
      );

    let category = new Categories({
      name: body.name,
      is_active: true,
      created_by: req.user?.id,
    });

    await category.save();

    AuditLogs.info(req.user?.email, "Categories", "Add", category);
    logger.info(req.user?.email, "Categories", "Add", category);

    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    logger.error(req.user?.email, "Categories", "Add", err);
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// UPDATE ENDPOINT
router.post("/update", async (req, res) => {
  let body = req.body;
  try {
    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Id is required",
        "Id field is missing in the request body",
      );

    let update = {};

    if (body.name) update.name = body.name;
    if (typeof body.is_active === "boolean") update.is_active = body.is_active;

    await Categories.updateOne({ _id: body._id }, update);

    AuditLogs.info(req.user?.email, "Categories", "Update", {
      _id: body._id,
      ...update,
    });

    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// DELETE ENDPOINT
router.delete("/delete", async (req, res) => {
  let body = req.body;
  try {
    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Id is required",
        "Id field is missing in the request body",
      );

    await Categories.deleteOne({ _id: body._id });
    AuditLogs.info(req.user?.email, "Categories", "Delete", {
      _id: body._id,
    });

    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

module.exports = router;
