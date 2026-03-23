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
const asyncHandler = require("../lib/asyncHandler");
const mongoose = require("mongoose");
const paginate = require("../lib/paginate");
const validate = require("../lib/validators/validate");
const userValidators = require("../lib/validators/users.validator");
const crypto = require("crypto");
const EmailService = require("../lib/email");
const Cache = require("../lib/cache");
const { RedisStore } = require("rate-limit-redis");
const { Redis } = require("@upstash/redis");
const { emailQueue } = require("../lib/queue");

// Rate limiter — sadece production'da aktif
const redisClient = new Redis({
  url: config.REDIS.URL,
  token: config.REDIS.TOKEN,
});
const limiter =
  process.env.NODE_ENV === "production"
    ? rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 5,
        legacyHeaders: false,
        store: new RedisStore({
          sendCommand: (...args) => redisClient.call(...args),
        }),
      })
    : (req, res, next) => next();

// LOGOUT
router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    const lang = req.headers["accept-language"] || config.DEFAULT_LANG;

    if (!token)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", lang),
        "Token is required",
      );

    // Token'ın kalan süresini hesapla
    const decoded = jwt.decode(token, config.JWT.SECRET);
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);

    if (ttl > 0) await Cache.blacklistToken(token, ttl);

    res.json(Response.successResponse({ message: "Logged out successfully" }));
  }),
);

// ─── PUBLIC ENDPOINTS ────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Kullanıcı işlemleri
 *
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         email:
 *           type: string
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         phone_number:
 *           type: string
 *         is_active:
 *           type: boolean
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: İlk admin kullanıcıyı oluşturur
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 example: "12345678"
 *               first_name:
 *                 type: string
 *                 example: Admin
 *               last_name:
 *                 type: string
 *                 example: User
 *               phone_number:
 *                 type: string
 *                 example: "05001234567"
 *     responses:
 *       201:
 *         description: Kullanıcı oluşturuldu
 *       400:
 *         description: Validasyon hatası
 *       403:
 *         description: Kayıt kapalı
 */

/**
 * @swagger
 * /users/auth:
 *   post:
 *     summary: Giriş yap, JWT token al
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 example: "12345678"
 *     responses:
 *       200:
 *         description: Token döner
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Hatalı email veya şifre
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Tüm kullanıcıları listele
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcı listesi
 *       401:
 *         description: Yetkisiz
 */

/**
 * @swagger
 * /users/add:
 *   post:
 *     summary: Yeni kullanıcı ekle
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, roles]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: "12345678"
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["64a1b2c3d4e5f6a7b8c9d0e1"]
 *     responses:
 *       201:
 *         description: Kullanıcı eklendi
 *       400:
 *         description: Validasyon hatası
 *       409:
 *         description: Email zaten mevcut
 */

/**
 * @swagger
 * /users/update:
 *   post:
 *     summary: Kullanıcı güncelle
 *     tags: [Users]
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
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               password:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Güncellendi
 *       400:
 *         description: Validasyon hatası
 */

/**
 * @swagger
 * /users/delete:
 *   delete:
 *     summary: Kullanıcı sil
 *     tags: [Users]
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

// REGISTER
router.post(
  "/register",
  validate(userValidators.register),
  asyncHandler(async (req, res) => {
    const body = req.body;
    const lang = req.headers["accept-language"] || config.DEFAULT_LANG;

    const existingUser = await Users.findOne({});
    if (existingUser)
      throw new CustomError(
        Enum.HTTP_CODES.FORBIDDEN,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", lang),
        i18n.translate("AUTH.REGISTER_DISABLED", lang),
      );

    const hashedPassword = bcrypt.hashSync(
      body.password,
      bcrypt.genSaltSync(10),
      null,
    );

    // TODO: Docker + Replica Set kurulumundan sonra transaction'ı aç
    // const session = await mongoose.startSession();
    // try {
    //   await session.withTransaction(async () => {
    //     const [createdUser] = await Users.create([{...}], { session });
    //     const [role] = await Roles.create([{...}], { session });
    //     await UserRoles.create([{...}], { session });
    //     await RolePrivileges.insertMany(privilegeDocs, { session });
    //   });
    // } finally {
    //   session.endSession();
    // }

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

    await UserRoles.create({ role_id: role._id, user_id: createdUser._id });

    const privilegeDocs = rolePrivConfig.privileges.map((p) => ({
      role_id: role._id,
      permission: p.key,
    }));

    await RolePrivileges.insertMany(privilegeDocs);

    // Kayıt sonrası doğrulama maili gönder
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await Users.updateOne(
      { email: body.email },
      {
        email_verify_token: verifyToken,
        email_verify_token_expires: verifyTokenExpires,
      },
    );

    try {
      // await EmailService.sendEmailVerification(body.email, verifyToken);
      await emailQueue.add("email_verification", {
        type: "email_verification",
        to: body.email,
        token: verifyToken,
      });
    } catch {
      //Redis yoksa mail gönderimini sessizce geç.
    }

    res
      .status(Enum.HTTP_CODES.CREATED)
      .json(
        Response.successResponse({ success: true }, Enum.HTTP_CODES.CREATED),
      );
  }),
);

// AUTH
router.post(
  "/auth",
  limiter,
  validate(userValidators.auth),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const lang = req.headers["accept-language"] || config.DEFAULT_LANG;
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
  }),
);

// FORGOT PASSWORD
router.post(
  "/forgot-password",
  validate(userValidators.forgotPassword),
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await Users.findOne({ email });

    // Güvenlik: kullanıcı bulunsun ya da bulunmasın aynı response dön
    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

      await Users.updateOne(
        { _id: user._id },
        {
          password_reset_token: resetToken,
          password_reset_token_expires: resetTokenExpires,
        },
      );

      try {
        // await EmailService.sendPasswordReset(email, resetToken);
        await emailQueue.add("password_reset", {
          type: "password_reset",
          to: email,
          token: resetToken,
        });
      } catch {
        // Redis yoksa sessizce geç
      }
    }

    res.json(
      Response.successResponse({
        message: "If this email exists, a reset link has been sent.",
      }),
    );
  }),
);

// RESET PASSWORD
router.post(
  "/reset-password",
  validate(userValidators.resetPassword),
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const lang = req.headers["accept-language"] || config.DEFAULT_LANG;

    const user = await Users.findOne({
      password_reset_token: token,
      password_reset_token_expires: { $gt: new Date() },
    });

    if (!user)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", lang),
        "Invalid or expired reset token",
      );

    const hashedPassword = bcrypt.hashSync(
      password,
      bcrypt.genSaltSync(10),
      null,
    );

    await Users.updateOne(
      { _id: user._id },
      {
        password: hashedPassword,
        password_reset_token: null,
        password_reset_token_expires: null,
      },
    );

    res.json(
      Response.successResponse({ message: "Password reset successful" }),
    );
  }),
);

// VERIFY EMAIL
router.post(
  "/verify-email",
  validate(userValidators.verifyEmail),
  asyncHandler(async (req, res) => {
    const { token } = req.body;
    const lang = req.headers["accept-language"] || config.DEFAULT_LANG;

    const user = await Users.findOne({
      email_verify_token: token,
      email_verify_token_expires: { $gt: new Date() },
    });

    if (!user)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", lang),
        "Invalid or expired verification token",
      );

    await Users.updateOne(
      { _id: user._id },
      {
        email_verified: true,
        email_verify_token: null,
        email_verify_token_expires: null,
      },
    );

    res.json(
      Response.successResponse({ message: "Email verified successfully" }),
    );
  }),
);

// RESEND VERIFICATION
router.post(
  "/resend-verification",
  validate(userValidators.resendVerification),
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await Users.findOne({ email });

    if (user && !user.email_verified) {
      const verifyToken = crypto.randomBytes(32).toString("hex");
      const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat

      await Users.updateOne(
        { _id: user._id },
        {
          email_verify_token: verifyToken,
          email_verify_token_expires: verifyTokenExpires,
        },
      );

      // await EmailService.sendEmailVerification(email, verifyToken);
      await emailQueue.add("email_verification", {
        type: "email_verification",
        to: email,
        token: verifyToken,
      });
    }

    res.json(
      Response.successResponse({
        message:
          "If this email exists and is unverified, a verification email has been sent.",
      }),
    );
  }),
);

// ─── PROTECTED ENDPOINTS ─────────────────────────────────────────────────────
router.use(auth.authenticate());

// LIST
router.get(
  "/",
  auth.checkRoles("user_view"),
  asyncHandler(async (req, res) => {
    const { page, limit, is_active } = req.query;
    const query = {};
    if (typeof is_active !== "undefined")
      query.is_active = is_active === "true";

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      Users.find(query, { password: 0 })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Users.countDocuments(query),
    ]);

    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const roles = await UserRoles.find({ user_id: user._id }).populate(
          "role_id",
        );
        return { ...user, roles };
      }),
    );

    res.json(
      Response.successResponse({
        data: usersWithRoles,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      }),
    );
  }),
);

// ADD
router.post(
  "/add",
  auth.checkRoles("user_add"),
  validate(userValidators.add),
  asyncHandler(async (req, res) => {
    const body = req.body;
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

    // TODO: Docker + Replica Set kurulumundan sonra transaction'ı aç
    // const session = await mongoose.startSession();
    // try {
    //   await session.withTransaction(async () => {
    //     const [user] = await Users.create([{...}], { session });
    //     await UserRoles.insertMany([...], { session });
    //   });
    // } finally {
    //   session.endSession();
    // }

    const user = await Users.create({
      email: body.email,
      password,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number,
    });

    await UserRoles.insertMany(
      roles.map((role) => ({ role_id: role._id, user_id: user._id })),
    );

    res
      .status(Enum.HTTP_CODES.CREATED)
      .json(
        Response.successResponse({ success: true }, Enum.HTTP_CODES.CREATED),
      );
  }),
);

// UPDATE
router.post(
  "/update",
  auth.checkRoles("user_update"),
  validate(userValidators.update),
  asyncHandler(async (req, res) => {
    const body = req.body;
    const updates = {};

    if (body._id == req.user.id)
      throw new CustomError(
        Enum.HTTP_CODES.FORBIDDEN,
        i18n.translate("COMMON.NEED_PERMISSIONS", req.user.language),
        i18n.translate("COMMON.NEED_PERMISSIONS", req.user.language),
      );

    if (body.password)
      updates.password = bcrypt.hashSync(
        body.password,
        bcrypt.genSaltSync(10),
        null,
      );

    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
    if (body.first_name) updates.first_name = body.first_name;
    if (body.last_name) updates.last_name = body.last_name;
    if (body.phone_number) updates.phone_number = body.phone_number;

    // TODO: Docker + Replica Set kurulumundan sonra transaction'ı aç
    // const session = await mongoose.startSession();
    // try {
    //   await session.withTransaction(async () => {
    //     ... rol ve kullanıcı güncellemeleri session ile ...
    //   });
    // } finally {
    //   session.endSession();
    // }

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
  }),
);

// DELETE
router.delete(
  "/delete",
  auth.checkRoles("user_delete"),
  validate(userValidators.delete),
  asyncHandler(async (req, res) => {
    const body = req.body;

    if (body._id.toString() === req.user.id.toString())
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        "You cannot delete your own account",
      );

    // TODO: Docker + Replica Set kurulumundan sonra transaction'ı aç
    // const session = await mongoose.startSession();
    // try {
    //   await session.withTransaction(async () => {
    //     await Users.deleteOne({ _id: body._id }, { session });
    //     await UserRoles.deleteMany({ user_id: body._id }, { session });
    //   });
    // } finally {
    //   session.endSession();
    // }

    await Users.deleteOne({ _id: body._id });
    await UserRoles.deleteMany({ user_id: body._id });

    res.json(Response.successResponse({ success: true }));
  }),
);

module.exports = router;
