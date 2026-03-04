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

router.use(auth.authenticate());

// LIST — Permission listesiyle birlikte rolleri döner
router.get("/", auth.checkRoles("role_view"), async (req, res) => {
  try {
    const roles = await Roles.find({}).lean();

    // FIX: Tek tek await yerine paralel sorgu (performans)
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const permissions = await RolePrivileges.find({ role_id: role._id });
        return { ...role, permissions };
      }),
    );

    res.json(Response.successResponse(rolesWithPermissions));
  } catch (err) {
    const errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// ADD
router.post("/add", auth.checkRoles("role_add"), async (req, res) => {
  const body = req.body;
  try {
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

    // FIX: Geçersiz permission key kontrolü
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

    // FIX: insertMany ile tek seferde kaydet (performans)
    await RolePrivileges.insertMany(
      body.permissions.map((perm) => ({
        role_id: role._id,
        permission: perm,
        created_by: req.user?.id,
      })),
    );

    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    const errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// UPDATE
router.post("/update", auth.checkRoles("role_update"), async (req, res) => {
  const body = req.body;
  try {
    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "_id",
        ]),
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

      // FIX: deleteOne → deleteMany (birden fazla kaldırılabilir)
      if (toRemove.length > 0)
        await RolePrivileges.deleteMany({
          _id: { $in: toRemove.map((x) => x._id) },
        });

      if (toAdd.length > 0)
        await RolePrivileges.insertMany(
          toAdd.map((perm) => ({
            role_id: body._id,
            permission: perm,
            created_by: req.user?.id,
          })),
        );
    }

    await Roles.updateOne({ _id: body._id }, updates);
    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    const errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// DELETE
router.delete("/delete", auth.checkRoles("role_delete"), async (req, res) => {
  const body = req.body;
  try {
    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "_id",
        ]),
      );

    await Roles.deleteOne({ _id: body._id });
    // Not: Roles model'i RolePrivileges'ı otomatik siliyor (Roles.js'deki override)
    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    const errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// Tüm geçerli permission key'lerini döner (frontend için kullanışlı)
router.get("/role_privileges", auth.checkRoles("role_view"), (req, res) => {
  res.json(Response.successResponse(role_privileges));
});

module.exports = router;
