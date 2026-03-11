const express = require("express");
const router = express.Router();
const Roles = require("../db/models/Roles");
const RolePrivileges = require("../db/models/RolePrivileges");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const role_privileges = require("../config/role_privileges");
const Enum = require("../config/Enum");
const auth = require("../lib/auth")();
const config = require("../config");
const i18n = new (require("../lib/i18n"))(config.DEFAULT_LANG);
const UserRoles = require("../db/models/UserRoles");
const asyncHandler = require("../lib/asyncHandler");

//SWAGGER
/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Rol işlemleri
 *
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         role_name:
 *           type: string
 *         is_active:
 *           type: boolean
 *         created_by:
 *           type: string
 */

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Tüm rolleri listele
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Rol listesi
 *       401:
 *         description: Yetkisiz
 */

/**
 * @swagger
 * /roles/add:
 *   post:
 *     summary: Yeni rol ekle
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role_name]
 *             properties:
 *               role_name:
 *                 type: string
 *                 example: EDITOR
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Rol eklendi
 *       400:
 *         description: Validasyon hatası
 */

/**
 * @swagger
 * /roles/update:
 *   post:
 *     summary: Rol güncelle
 *     tags: [Roles]
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
 *               role_name:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               privileges:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["user_view", "category_add"]
 *     responses:
 *       200:
 *         description: Güncellendi
 *       400:
 *         description: Validasyon hatası
 */

/**
 * @swagger
 * /roles/delete:
 *   delete:
 *     summary: Rol sil
 *     tags: [Roles]
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

// ─── PROTECTED ENDPOINTS
router.use(auth.authenticate());

// LIST
router.get(
  "/",
  auth.checkRoles("role_view"),
  asyncHandler(async (req, res) => {
    const roles = await Roles.find({}).lean();

    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const permissions = await RolePrivileges.find({ role_id: role._id });
        return { ...role, permissions };
      }),
    );

    res.json(Response.successResponse(rolesWithPermissions));
  }),
);

// ADD
router.post(
  "/add",
  auth.checkRoles("role_add"),
  asyncHandler(async (req, res) => {
    const body = req.body;

    if (!body.role_name)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "role_name",
        ]),
      );

    if (
      !body.permissions ||
      !Array.isArray(body.permissions) ||
      body.permissions.length === 0
    )
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_TYPE", req.user.language, [
          "permissions",
          "Array",
        ]),
      );

    const validKeys = role_privileges.privileges.map((p) => p.key);
    const invalidPerms = body.permissions.filter((p) => !validKeys.includes(p));
    if (invalidPerms.length > 0)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        `Invalid permissions: ${invalidPerms.join(", ")}`,
      );

    const role = await Roles.create({
      role_name: body.role_name,
      is_active: true,
      created_by: req.user?.id,
    });

    await RolePrivileges.insertMany(
      body.permissions.map((perm) => ({
        role_id: role._id,
        permission: perm,
        created_by: req.user?.id,
      })),
    );

    res.json(Response.successResponse({ success: true }));
  }),
);

// UPDATE
router.post(
  "/update",
  auth.checkRoles("role_update"),
  asyncHandler(async (req, res) => {
    const body = req.body;

    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "_id",
        ]),
      );

    const userRole = await UserRoles.findOne({
      user_id: req.user.id,
      role_id: body._id,
    });

    if (userRole)
      throw new CustomError(
        Enum.HTTP_CODES.FORBIDDEN,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        "You cannot update a role assigned to yourself",
      );

    const updates = {};
    if (body.role_name) updates.role_name = body.role_name;
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;

    if (
      body.permissions &&
      Array.isArray(body.permissions) &&
      body.permissions.length > 0
    ) {
      const existing = await RolePrivileges.find({ role_id: body._id });
      const existingKeys = existing.map((p) => p.permission);

      const toRemove = existing.filter(
        (x) => !body.permissions.includes(x.permission),
      );
      const toAdd = body.permissions.filter((x) => !existingKeys.includes(x));

      if (toRemove.length > 0)
        await RolePrivileges.deleteMany({
          _id: { $in: toRemove.map((x) => x._id) },
        });

      if (toAdd.length > 0) {
        const myRoles = await UserRoles.find({ user_id: req.user.id });
        const myPrivileges = await RolePrivileges.find({
          role_id: { $in: myRoles.map((r) => r.role_id) },
        });
        const myPermissionKeys = myPrivileges.map((p) => p.permission);

        const exceedsMyPerms = toAdd.some((p) => !myPermissionKeys.includes(p));
        if (exceedsMyPerms)
          throw new CustomError(
            Enum.HTTP_CODES.FORBIDDEN,
            i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
            "You cannot grant permissions you do not have",
          );

        await RolePrivileges.insertMany(
          toAdd.map((perm) => ({
            role_id: body._id,
            permission: perm,
            created_by: req.user?.id,
          })),
        );
      }
    }

    await Roles.updateOne({ _id: body._id }, updates);
    res.json(Response.successResponse({ success: true }));
  }),
);

// DELETE
router.delete(
  "/delete",
  auth.checkRoles("role_delete"),
  asyncHandler(async (req, res) => {
    const body = req.body;

    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "_id",
        ]),
      );

    await Roles.deleteOne({ _id: body._id });
    res.json(Response.successResponse({ success: true }));
  }),
);

// Tüm geçerli permission key'lerini döner
router.get(
  "/role_privileges",
  auth.checkRoles("role_view"),
  asyncHandler(async (req, res) => {
    res.json(Response.successResponse(role_privileges));
  }),
);

module.exports = router;
