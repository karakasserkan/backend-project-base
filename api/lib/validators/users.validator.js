const Joi = require("joi");
const Enum = require("../../config/Enum");

module.exports = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(Enum.PASS_LENGTH).required(),
    first_name: Joi.string().optional(),
    last_name: Joi.string().optional(),
    phone_number: Joi.string().optional(),
  }),

  auth: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(Enum.PASS_LENGTH).required(),
  }),

  add: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(Enum.PASS_LENGTH).required(),
    first_name: Joi.string().optional(),
    last_name: Joi.string().optional(),
    phone_number: Joi.string().optional(),
    roles: Joi.array().items(Joi.string()).min(1).required(),
  }),

  update: Joi.object({
    _id: Joi.string().required(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(Enum.PASS_LENGTH).optional(),
    first_name: Joi.string().optional(),
    last_name: Joi.string().optional(),
    phone_number: Joi.string().optional(),
    is_active: Joi.boolean().optional(),
    roles: Joi.array().items(Joi.string()).optional(),
  }),

  delete: Joi.object({
    _id: Joi.string().required(),
  }),
};
