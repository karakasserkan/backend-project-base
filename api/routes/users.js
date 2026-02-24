var express = require("express");
var router = express.Router();
const Users = require("../db/models/Users");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const bcrypt = require("bcrypt-nodejs");
const is = require("is_js");
const Roles = require("../db/models/Roles");
const UserRoles = require("../db/models/UserRoles");
const config = require("../config");
const jwt = require("jwt-simple");

/* GET users listing. */
router.get("/", async (req, res) => {
  try {
    let users = await Users.find({});
    res.json(Response.successResponse(users));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// ADD ENDPOINT
router.post("/add", async (req, res) => {
  let body = req.body;
  try {
    if (!body.email)
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Email is required");
    if (!is.email(body.email)) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Email is not valid");
    }

    if (!body.password)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Password is required",
      );
    if (body.password.length < Enum.PASS_LENGTH) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        `Password must be at least ${Enum.PASS_LENGTH} characters long`,
      );
    }

    if (!body.roles || !Array.isArray(body.roles) || body.roles.length === 0) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Roles are required");
    }

    let roles = await Roles.find({ _id: { $in: body.roles } });
    if (roles.length == 0) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Invalid roles");
    }
    let password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(10), null);
    let user = await Users.create({
      email: body.email,
      password,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number,
    });

    for (let i = 0; i < roles.length; i++) {
      await UserRoles.create({
        role_id: roles[i]._id,
        user_id: user._id,
      });
    }

    res
      .status(Enum.HTTP_CODES.CREATED)
      .json(
        Response.successResponse({ success: true }, Enum.HTTP_CODES.CREATED),
      );
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// UPDATE ENDPOINT

router.post("/update", async (req, res) => {
  let body = req.body;
  let updates = {};
  if (!body._id)
    throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "User ID is required");
  try {
    if (body.password && body.password.length >= Enum.PASS_LENGTH) {
      updates.password = bcrypt.hashSync(
        body.password,
        bcrypt.genSaltSync(10),
        null,
      );
    }

    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
    if (body.first_name) updates.first_name = body.first_name;
    if (body.last_name) updates.last_name = body.last_name;
    if (body.phone_number) updates.phone_number = body.phone_number;

    if (Array.isArray(body.roles) && body.roles.length > 0) {
      let userRoles = await UserRoles.find({ user_id: body._id });
      let removedRoles = userRoles.filter(
        (x) => !body.roles.includes(x.role_id.toString()),
      );

      let newRoles = body.roles.filter(
        (x) => !userRoles.map((r) => r.role_id.toString()).includes(x),
      );
      if (removedRoles.length > 0) {
        await UserRoles.deleteMany({
          _id: { $in: removedRoles.map((x) => x._id.toString()) },
        });
      }

      if (newRoles.length > 0) {
        for (let i = 0; i < newRoles.length; i++) {
          let userRole = new UserRoles({
            role_id: newRoles[i],
            user_id: body._id,
          });
          await userRole.save();
        }
      }
    }

    await Users.updateOne({ _id: body._id }, updates);
    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// DELETE ENDPOINT

router.delete("/delete", async (req, res) => {
  let body = req.body;
  if (!body._id)
    throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "User ID is required");
  try {
    await Users.deleteOne({ _id: body._id });

    await UserRoles.deleteMany({ user_id: body._id });
    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// REGISTER ENDPOINT
router.post("/register", async (req, res) => {
  let body = req.body;
  let user = await Users.findOne({});
  if (user) {
    return res.sendStatus(Enum.HTTP_CODES.NOT_FOUND);
  }
  try {
    if (!body.email)
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Email is required");
    if (!is.email(body.email)) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Email is not valid");
    }

    if (!body.password)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Password is required",
      );
    if (body.password.length < Enum.PASS_LENGTH) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        `Password must be at least ${Enum.PASS_LENGTH} characters long`,
      );
    }

    let password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(10), null);

    let createdUser = await Users.create({
      email: body.email,
      password,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number,
    });

    let role = await Roles.create({
      role_name: Enum.SUPER_ADMIN,
      is_active: true,
      created_by: createdUser._id,
    });

    await UserRoles.create({
      role_id: role._id,
      user_id: createdUser._id,
    });

    res
      .status(Enum.HTTP_CODES.CREATED)
      .json(
        Response.successResponse({ success: true }, Enum.HTTP_CODES.CREATED),
      );
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// AUTHENTICATE ENDPOINT
router.post("/auth", async (req, res) => {
  try {
    let { email, password } = req.body;
    Users.validateFieldsBeforeAuth(email, password);
    let user = await Users.findOne({ email });

    if (!user)
      throw new CustomError(
        Enum.HTTP_CODES.UNAUTHORIZED,
        "Invalid email or password",
        "email or password wrong",
      );
    if (!user.validPassword(password))
      throw new CustomError(
        Enum.HTTP_CODES.UNAUTHORIZED,
        "Invalid email or password",
        "email or password wrong",
      );

    let payload = {
      id: user._id,
      exp: parseInt(Date.now() / 1000) * config.JWT.EXPIRE_TIME,
    };

    let token = jwt.encode(payload, config.JWT.SECRET);

    let userData = {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
    };
    res.json(Response.successResponse({ token, user: userData }));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

module.exports = router;
