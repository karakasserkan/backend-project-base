const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    level: {
      type: String,
      enum: ["info", "warn", "error", "debug", "verbose", "http", "silly"],
      required: true,
    },
    email: { type: String },
    location: { type: String },
    proc_type: { type: String },
    log: { type: mongoose.SchemaTypes.Mixed },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

class AuditLogs extends mongoose.Model {}

schema.loadClass(AuditLogs);

module.exports = mongoose.model("audit_logs", schema);
