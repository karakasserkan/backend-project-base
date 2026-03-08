const mongoose = require("mongoose");
const Roles = require("./Roles");
const Users = require("./Users");

const schema = mongoose.Schema(
  {
    role_id: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      ref: "roles",
    },
    user_id: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      ref: "users",
    },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

class UserRoles extends mongoose.Model {}

schema.loadClass(UserRoles);
schema.index({ user_id: 1, role_id: 1 }, { unique: true });

module.exports = mongoose.model("user_roles", schema);
