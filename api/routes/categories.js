const express = require("express");
const router = express.Router();
const Categories = require("../db/models/Categories");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
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
const asyncHandler = require("../lib/asyncHandler");
const paginate = require("../lib/paginate");
const validate = require("../lib/validators/validate");
const categoryValidators = require("../lib/validators/categories.validator");

// Multer storage config
const multerStorage = multer.diskStorage({
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

//SWAGGER
/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Kategori işlemleri
 *
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         is_active:
 *           type: boolean
 *         created_by:
 *           type: string
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Tüm kategorileri listele
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Kategori listesi
 *       401:
 *         description: Yetkisiz
 */

/**
 * @swagger
 * /categories/add:
 *   post:
 *     summary: Yeni kategori ekle
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Elektronik
 *     responses:
 *       200:
 *         description: Kategori eklendi
 *       400:
 *         description: Validasyon hatası
 */

/**
 * @swagger
 * /categories/update:
 *   post:
 *     summary: Kategori güncelle
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [_id]
 *             properties:
 *               _id:
 *                 type: string
 *               name:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Güncellendi
 *       400:
 *         description: Validasyon hatası
 */

/**
 * @swagger
 * /categories/delete:
 *   delete:
 *     summary: Kategori sil
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [_id]
 *             properties:
 *               _id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Silindi
 *       400:
 *         description: Validasyon hatası
 */

/**
 * @swagger
 * /categories/export:
 *   get:
 *     summary: Kategorileri Excel olarak indir
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Excel dosyası
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */

/**
 * @swagger
 * /categories/import:
 *   post:
 *     summary: Excel'den kategori içe aktar
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               pb_file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: İçe aktarıldı
 *       400:
 *         description: Geçersiz dosya
 */

router.use(auth.authenticate());

// LIST
router.get(
  "/",
  auth.checkRoles("category_view"),
  asyncHandler(async (req, res) => {
    const { page, limit, is_active } = req.query;
    const query = {};
    if (typeof is_active !== "undefined")
      query.is_active = is_active === "true";

    const result = await paginate(Categories, query, { page, limit });
    res.json(Response.successResponse(result));
  }),
);

// ADD
router.post(
  "/add",
  auth.checkRoles("category_add"),
  validate(categoryValidators.add),
  asyncHandler(async (req, res) => {
    const body = req.body;

    const category = new Categories({
      name: body.name,
      is_active: body.is_active ?? true,
      created_by: req.user?.id,
    });

    await category.save();

    logger.info(req.user?.email, "Categories", "Add", category);

    emitter
      .getEmitter("notifications")
      .emit("messages", { message: category.name + " is added" });

    res.json(Response.successResponse({ success: true }));
  }),
);

// UPDATE
router.post(
  "/update",
  auth.checkRoles("category_update"),
  validate(categoryValidators.update),
  asyncHandler(async (req, res) => {
    const body = req.body;

    const update = {};
    if (body.name) update.name = body.name;
    if (typeof body.is_active === "boolean") update.is_active = body.is_active;

    await Categories.updateOne({ _id: body._id }, update);

    logger.info(req.user?.email, "Categories", "Update", {
      _id: body._id,
      ...update,
    });

    res.json(Response.successResponse({ success: true }));
  }),
);

// DELETE
router.delete(
  "/delete",
  auth.checkRoles("category_delete"),
  validate(categoryValidators.delete),
  asyncHandler(async (req, res) => {
    const body = req.body;

    await Categories.deleteOne({ _id: body._id });

    logger.info(req.user?.email, "Categories", "Delete", { _id: body._id });

    res.json(Response.successResponse({ success: true }));
  }),
);

// EXPORT
router.get(
  "/export",
  auth.checkRoles("category_export"),
  asyncHandler(async (req, res) => {
    const categories = await Categories.find({});

    const excel = excelExport.toExcel(
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
  }),
);

// IMPORT
router.post(
  "/import",
  auth.checkRoles("category_import"),
  upload,
  async (req, res) => {
    let file;
    try {
      file = req.file;

      if (!file)
        throw new CustomError(
          Enum.HTTP_CODES.BAD_REQUEST,
          "File is required",
          "File is required",
        );

      const rows = Import.fromExcel(file.path);
      const headers = rows[0];

      if (!headers || headers[0] !== "NAME")
        throw new CustomError(
          Enum.HTTP_CODES.BAD_REQUEST,
          "Invalid Excel Format",
          "Invalid Excel Format",
        );

      let insertedCount = 0;

      for (let i = 1; i < rows.length; i++) {
        const [name, is_active] = rows[i];
        if (name) {
          const exists = await Categories.findOne({ name });
          if (!exists) {
            const active =
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
      const errorResponse = Response.errorResponse(err);
      res.status(errorResponse.code).json(errorResponse);
    } finally {
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  },
);

module.exports = router;
