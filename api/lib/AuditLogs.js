const AuditLogsModel = require("../db/models/AuditLogs");
const Enum = require("../config/Enum");

let instance = null;
class AuditLogs {
  constructor() {
    if (!instance) {
      instance = this;
    }
    return instance;
  }

  info(email, location, proc_type, log) {
    this.#saveToDB({
      email,
      location,
      proc_type,
      log,
      level: Enum.LOG_LEVELS.INFO,
    });
  }
  warn(email, location, proc_type, log) {
    this.#saveToDB({
      email,
      location,
      proc_type,
      log,
      level: Enum.LOG_LEVELS.WARN,
    });
  }
  error(email, location, proc_type, log) {
    this.#saveToDB({
      email,
      location,
      proc_type,
      log,
      level: Enum.LOG_LEVELS.ERROR,
    });
  }
  debug(email, location, proc_type, log) {
    this.#saveToDB({
      email,
      location,
      proc_type,
      log,
      level: Enum.LOG_LEVELS.DEBUG,
    });
  }
  verbose(email, location, proc_type, log) {
    this.#saveToDB({
      email,
      location,
      proc_type,
      log,
      level: Enum.LOG_LEVELS.VERBOSE,
    });
  }
  http(email, location, proc_type, log) {
    this.#saveToDB({
      email,
      location,
      proc_type,
      log,
      level: Enum.LOG_LEVELS.HTTP,
    });
  }

  async #saveToDB({ email, location, proc_type, log, level }) {
    try {
      await AuditLogsModel.create({ level, email, location, proc_type, log });
    } catch (err) {
      console.error("AuditLog write failed:", err);
    }
  }
}

module.exports = new AuditLogs();
