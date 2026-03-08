const { EventEmitter } = require("events");

var instance = null;
class Emitter {
  constructor() {
    if (!instance) {
      this.emitters = {};
      instance = this;
    }
    return instance;
  }
  getEmitter(name) {
    return this.emitters[name];
  }
  addEmitter(name) {
    if (this.emitters[name]) return this.emitters[name]; // zaten varsa döndür
    this.emitters[name] = new EventEmitter();
    return this.emitters[name];
  }
}

module.exports = new Emitter();
