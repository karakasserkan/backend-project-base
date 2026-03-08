const mongoose = require("mongoose");
const RolePrivileges = require("./RolePrivileges");

const schema = mongoose.Schema(
  {
    role_name: { type: String, required: true, unique: true, trim: true },
    is_active: { type: Boolean, default: true },
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

class Roles extends mongoose.Model {
  // Role silinince ilgili tüm RolePrivileges kayıtlarını da sil
  static async deleteOne(query) {
    if (query._id) {
      await RolePrivileges.deleteMany({ role_id: query._id }); // FIX: deleteOne → deleteMany
    }
    return super.deleteOne(query); // FIX: return eklendi (sonucu iletmek için)
  }
}

schema.loadClass(Roles);

module.exports = mongoose.model("roles", schema);
