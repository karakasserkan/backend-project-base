const logger = require("./logger");
const AuditLogsModel = require("../../db/models/AuditLogs");
let instance = null;

class LoggerClass {
  constructor() {
    if (!instance) {
      instance = this;
    }
    return instance;
  }

  #createLogObject(email, location, proc_type, log) {
    return { email, location, proc_type, log };
  }

  // DB'ye kaydet
  async #saveToDB(level, email, location, proc_type, log) {
    try {
      await AuditLogsModel.create({
        level: level.toLowerCase(),
        email,
        location,
        proc_type,
        log,
      });
    } catch (err) {
      logger.error({
        email: "system",
        location: "LoggerClass",
        proc_type: "saveToDB",
        log: err.message,
      });
    }
  }

  info(email, location, proc_type, log) {
    const logs = this.#createLogObject(email, location, proc_type, log);
    logger.info(logs);
    this.#saveToDB("info", email, location, proc_type, log);
  }

  warn(email, location, proc_type, log) {
    const logs = this.#createLogObject(email, location, proc_type, log);
    logger.warn(logs);
    this.#saveToDB("warn", email, location, proc_type, log);
  }

  error(email, location, proc_type, log) {
    const logs = this.#createLogObject(email, location, proc_type, log);
    logger.error(logs);
    this.#saveToDB("error", email, location, proc_type, log);
  }

  verbose(email, location, proc_type, log) {
    const logs = this.#createLogObject(email, location, proc_type, log);
    logger.verbose(logs);
  }

  silly(email, location, proc_type, log) {
    const logs = this.#createLogObject(email, location, proc_type, log);
    logger.silly(logs);
  }

  http(email, location, proc_type, log) {
    const logs = this.#createLogObject(email, location, proc_type, log);
    logger.http(logs);
  }

  debug(email, location, proc_type, log) {
    const logs = this.#createLogObject(email, location, proc_type, log);
    logger.debug(logs);
  }
}

module.exports = new LoggerClass();
