var express = require("express");
var router = express.Router();
const Users = require("../db/models/Users");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const bcrypt = require("bcrypt-nodejs");
const is = require("is_js");

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

    let password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(10), null);
    await Users.create({
      email: body.email,
      password,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number,
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
    await Users.create({
      email: body.email,
      password,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number,
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

module.exports = router;
