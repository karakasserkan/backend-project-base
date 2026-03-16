const Joi = require("joi");

module.exports = {
  add: Joi.object({
    role_name: Joi.string().required(),
    is_active: Joi.boolean().optional(),
  }),

  update: Joi.object({
    _id: Joi.string().required(),
    role_name: Joi.string().optional(),
    is_active: Joi.boolean().optional(),
    privileges: Joi.array().items(Joi.string()).optional(),
  }),

  delete: Joi.object({
    _id: Joi.string().required(),
  }),
};
