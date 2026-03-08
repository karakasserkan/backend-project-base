const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    permission: { type: String, required: true },
    role_id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    created_by: { type: mongoose.SchemaTypes.ObjectId },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

class RolePrivileges extends mongoose.Model {}

schema.loadClass(RolePrivileges);
schema.index({ role_id: 1, permission: 1 }, { unique: true });

module.exports = mongoose.model("role_privileges", schema);
