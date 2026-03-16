const Joi = require("joi");

module.exports = {
  add: Joi.object({
    name: Joi.string().required(),
    is_active: Joi.boolean().optional(),
  }),

  update: Joi.object({
    _id: Joi.string().required(),
    name: Joi.string().optional(),
    is_active: Joi.boolean().optional(),
  }),

  delete: Joi.object({
    _id: Joi.string().required(),
  }),
};
