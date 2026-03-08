const express = require("express");
const router = express.Router();
const Categories = require("../db/models/Categories");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const AuditLogs = require("../lib/AuditLogs");
const logger = require("../lib/logger/LoggerClass");
const auth = require("../lib/auth")();
const config = require("../config");
const i18n = new (require("../lib/i18n"))(config.DEFAULT_LANG);
const emitter = require("../lib/Emitter");
const excelExport = new (require("../lib/Export"))();
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const Import = new (require("../lib/Import"))();

// IMPORT
let multerStorage = multer.diskStorage({
  destination: (req, file, next) => {
    next(null, config.FILE_UPLOAD_PATH);
  },
  filename: (req, file, next) => {
    next(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname),
    );
  },
});

const upload = multer({ storage: multerStorage }).single("pb_file");

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
router.get("/", auth.checkRoles("category_view"), async (req, res, next) => {
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
router.post("/add", auth.checkRoles("category_add"), async (req, res, next) => {
  let body = req.body;
  try {
    if (!body.name)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "name",
        ]),
      );

    let category = new Categories({
      name: body.name,
      is_active: true,
      created_by: req.user?.id,
    });

    await category.save();

    AuditLogs.info(req.user?.email, "Categories", "Add", category);
    logger.info(req.user?.email, "Categories", "Add", category);

    emitter
      .getEmitter("notifications")
      .emit("messages", { message: category.name + "is added" });

    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    logger.error(req.user?.email, "Categories", "Add", err);
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// UPDATE ENDPOINT
router.post("/update", auth.checkRoles("category_update"), async (req, res) => {
  let body = req.body;
  try {
    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "_id",
        ]),
      );

    let update = {};

    if (body.name) update.name = body.name;
    if (typeof body.is_active === "boolean") update.is_active = body.is_active;

    await Categories.updateOne({ _id: body._id }, update);

    AuditLogs.info(req.user?.email, "Categories", "Update", {
      _id: body._id,
      ...update,
    });
    logger.info(req.user?.email, "Categories", "Update", {
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
router.delete(
  "/delete",
  auth.checkRoles("category_delete"),
  async (req, res) => {
    let body = req.body;
    try {
      if (!body._id)
        throw new CustomError(
          Enum.HTTP_CODES.BAD_REQUEST,
          i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
          i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
            "_id",
          ]),
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
  },
);

// EXPORT ENDPOINT
router.get("/export", auth.checkRoles("category_export"), async (req, res) => {
  try {
    // let categories = await Categories.find({});

    // let excel = excelExport.toExcel(
    //   [
    //     "NAME",
    //     "IS ACTIVE?",
    //     "USER ID",
    //     "CREATED BY",
    //     "UPDATED AT",
    //     "CREATED AT",
    //   ],
    //   [
    //     "name",
    //     "is_active",
    //     "user_id",
    //     "created_by",
    //     "updated_at",
    //     "created_at",
    //   ],
    //   categories,
    // );

    // let filePath =
    //   __dirname + "/../tmp/categories_excel_" + Date.now() + ".xlsx";
    // fs.writeFileSync(filePath, excel, "UTF-8");
    // res.download(filePath);
    // //fs.unlinkSync(filePath);
    let categories = await Categories.find({});

    let excel = excelExport.toExcel(
      ["NAME", "IS ACTIVE?", "USER ID", "UPDATED AT", "CREATED AT"],
      ["name", "is_active", "user_id", "updated_at", "created_at"],
      categories,
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=categories.xlsx",
    );

    return res.status(200).send(excel);
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// IMPORT ENDPOINT
router.post(
  "/import",
  auth.checkRoles("category_import"),
  upload,
  async (req, res) => {
    let file;
    try {
      file = req.file;
      if (!req.file) {
        throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "File is required");
      }
      let body = req.body;

      let rows = Import.fromExcel(file.path);
      // HEADER KONTROLÜ
      let headers = rows[0];

      if (!headers || headers[0] !== "NAME") {
        throw new CustomError(
          Enum.HTTP_CODES.BAD_REQUEST,
          "Invalid Excel Format",
        );
      }
      let insertedCount = 0;

      for (let i = 1; i < rows.length; i++) {
        let [name, is_active, user, created_at, updated_at] = rows[i];
        if (name) {
          let exists = await Categories.findOne({ name });
          if (!exists) {
            let active =
              is_active === true ||
              is_active === "true" ||
              is_active === 1 ||
              is_active === "1";

            await Categories.create({
              name,
              is_active: active,
              created_by: req.user._id,
            });
            insertedCount++;
          }
        }
      }
      res.json(
        Response.successResponse(
          { inserted: insertedCount },
          Enum.HTTP_CODES.CREATED,
        ),
      );
    } catch (err) {
      let errorResponse = Response.errorResponse(err);
      res.status(errorResponse.code).json(errorResponse);
    } finally {
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  },
);

module.exports = router;
