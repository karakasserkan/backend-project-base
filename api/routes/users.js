var express = require("express");
var router = express.Router();
const Users = require("../db/models/Users");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const bcrypt = require("bcrypt-nodejs");
const validator = require("validator");
const Roles = require("../db/models/Roles");
const UserRoles = require("../db/models/UserRoles");
const config = require("../config");
const jwt = require("jwt-simple");
const auth = require("../lib/auth")();
const i18n = new (require("../lib/i18n"))(config.DEFAULT_LANG);
const RolePrivileges = require("../db/models/RolePrivileges");
const rolePrivConfig = require("../config/role_privileges");
const { rateLimit } = require("express-rate-limit");
const { MongoDBStore } = require("@iroomit/rate-limit-mongodb");

// LIMIT ENDPOINT
const limiter = rateLimit({
  store: new MongoDBStore({
    uri: config.CONNECTION_STRING,
    collectionName: "rateLimits",
    resetExpireDateOnChange: true, // pencere süresini her istekte sıfırlar
    expireTimeMs: 15 * 60 * 1000, // 15 min
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes).
  // standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
});

// ─── PUBLIC ENDPOINTS ────────────────────────────────────────────────────────

// REGISTER — Sadece sistemde hiç kullanıcı yoksa çalışır, ilk SUPER_ADMIN'i oluşturur
router.post("/register", async (req, res) => {
  try {
    const body = req.body;
    const lang = req.headers["accept-language"] || config.DEFAULT_LANG;

    const existingUser = await Users.findOne({});
    if (existingUser) {
      throw new CustomError(
        Enum.HTTP_CODES.FORBIDDEN, // FIX: 404 değil 403 daha semantik doğru
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", lang),
        i18n.translate("AUTH.REGISTER_DISABLED", lang),
      );
    }

    if (!body.email)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", lang),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", lang, ["email"]),
      );

    if (!validator.isEmail(body.email))
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", lang),
        i18n.translate("COMMON.INVALID_EMAIL", lang),
      );

    if (!body.password || body.password.length < Enum.PASS_LENGTH)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", lang),
        i18n.translate("COMMON.PASSWORD_LENGTH", lang, [Enum.PASS_LENGTH]),
      );

    const hashedPassword = bcrypt.hashSync(
      body.password,
      bcrypt.genSaltSync(10),
      null,
    );

    const createdUser = await Users.create({
      email: body.email,
      password: hashedPassword,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number,
    });

    const role = await Roles.create({
      role_name: Enum.SUPER_ADMIN,
      is_active: true,
      created_by: createdUser._id,
    });

    await UserRoles.create({
      role_id: role._id,
      user_id: createdUser._id,
    });

    const privilegeDocs = rolePrivConfig.privileges.map((p) => ({
      role_id: role._id,
      permission: p.key,
    }));

    await RolePrivileges.insertMany(privilegeDocs);

    res
      .status(Enum.HTTP_CODES.CREATED)
      .json(
        Response.successResponse({ success: true }, Enum.HTTP_CODES.CREATED),
      );
  } catch (err) {
    const errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// AUTH — Email/şifre ile giriş, JWT token döner
router.post("/auth", limiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const lang = req.headers["accept-language"] || config.DEFAULT_LANG;

    Users.validateFieldsBeforeAuth(email, password);

    const user = await Users.findOne({ email });

    if (!user)
      throw new CustomError(
        Enum.HTTP_CODES.UNAUTHORIZED,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", lang),
        i18n.translate("USERS.AUTH_ERROR", lang),
      );

    if (!user.validPassword(password))
      throw new CustomError(
        Enum.HTTP_CODES.UNAUTHORIZED,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", lang),
        i18n.translate("USERS.AUTH_ERROR", lang),
      );

    const payload = {
      id: user._id,
      exp: parseInt(Date.now() / 1000) + config.JWT.EXPIRE_TIME,
    };

    const token = jwt.encode(payload, config.JWT.SECRET);

    res.json(
      Response.successResponse({
        token,
        user: {
          _id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      }),
    );
  } catch (err) {
    const errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// ─── PROTECTED ENDPOINTS (JWT gerektirir) ────────────────────────────────────
router.use(auth.authenticate());

// LIST
router.get("/", auth.checkRoles("user_view"), async (req, res) => {
  try {
    const users = await Users.find({}, { password: 0 }).lean();

    for (let i = 0; i < users.length; i++) {
      let roles = await UserRoles.find({ user_id: users[i]._id }).populate(
        "role_id",
      );
      users[i].roles = roles;
    }
    res.json(Response.successResponse(users));
  } catch (err) {
    const errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// ADD
router.post("/add", auth.checkRoles("user_add"), async (req, res) => {
  const body = req.body;
  try {
    if (!body.email)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "email",
        ]),
      );

    if (!validator.isEmail(body.email))
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("USERS.EMAIL_FORMAT_ERROR", req.user.language),
      );

    if (!body.password || body.password.length < Enum.PASS_LENGTH)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("USERS.PASSWORD_LENGTH_ERROR", req.user.language, [
          Enum.PASS_LENGTH,
        ]),
      );

    if (!body.roles || !Array.isArray(body.roles) || body.roles.length === 0)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_TYPE", req.user.language, [
          "roles",
          "Array",
        ]),
      );

    const roles = await Roles.find({ _id: { $in: body.roles } });
    if (roles.length === 0)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_TYPE", req.user.language, [
          "roles",
          "Array",
        ]),
      );

    // FIX: Duplicate email kontrolü eklendi
    const existingUser = await Users.findOne({ email: body.email });
    if (existingUser)
      throw new CustomError(
        Enum.HTTP_CODES.CONFLICT,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("USERS.EMAIL_ALREADY_EXISTS", req.user.language),
      );

    const password = bcrypt.hashSync(
      body.password,
      bcrypt.genSaltSync(10),
      null,
    );

    const user = await Users.create({
      email: body.email,
      password,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number,
    });

    // FIX: insertMany ile tek seferde kaydet (performans)
    await UserRoles.insertMany(
      roles.map((role) => ({ role_id: role._id, user_id: user._id })),
    );

    res
      .status(Enum.HTTP_CODES.CREATED)
      .json(
        Response.successResponse({ success: true }, Enum.HTTP_CODES.CREATED),
      );
  } catch (err) {
    const errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// UPDATE
router.post("/update", auth.checkRoles("user_update"), async (req, res) => {
  const body = req.body;
  const updates = {};

  // FIX: try/catch dışındaki throw yakalanmıyordu, içine alındı
  try {
    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "_id",
        ]),
      );

    if (body.password && body.password.length >= Enum.PASS_LENGTH)
      updates.password = bcrypt.hashSync(
        body.password,
        bcrypt.genSaltSync(10),
        null,
      );

    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
    if (body.first_name) updates.first_name = body.first_name;
    if (body.last_name) updates.last_name = body.last_name;
    if (body.phone_number) updates.phone_number = body.phone_number;

    if (body._id == req.user.id) {
      throw new CustomError(
        Enum.HTTP_CODES.FORBIDDEN,
        i18n.translate("COMMON.NEED_PERMISSIONS", req.user.language),
        i18n.translate("COMMON.NEED_PERMISSIONS", req.user.language),
      );
    }

    if (Array.isArray(body.roles) && body.roles.length > 0) {
      const userRoles = await UserRoles.find({ user_id: body._id });

      const removedRoles = userRoles.filter(
        (x) => !body.roles.includes(x.role_id.toString()),
      );
      const newRoles = body.roles.filter(
        (x) => !userRoles.map((r) => r.role_id.toString()).includes(x),
      );

      if (removedRoles.length > 0)
        await UserRoles.deleteMany({
          _id: { $in: removedRoles.map((x) => x._id) },
        });

      if (newRoles.length > 0)
        await UserRoles.insertMany(
          newRoles.map((roleId) => ({ role_id: roleId, user_id: body._id })),
        );
    }

    await Users.updateOne({ _id: body._id }, { $set: updates });
    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    const errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// DELETE
router.delete("/delete", auth.checkRoles("user_delete"), async (req, res) => {
  const body = req.body;
  try {
    // FIX: try/catch dışındaki throw yakalanmıyordu, içine alındı
    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "_id",
        ]),
      );

    // FIX: Kendini silmeyi engelle
    if (body._id.toString() === req.user.id.toString())
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        "You cannot delete your own account",
      );

    await Users.deleteOne({ _id: body._id });
    await UserRoles.deleteMany({ user_id: body._id });

    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    const errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

module.exports = router;
