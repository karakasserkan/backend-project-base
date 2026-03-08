const i18n = require("../i18n");

class I18n {
  constructor(lang) {
    this.lang = lang;
  }
  translate(text, lang = this.lang, params = []) {
    try {
      let arr = text.split(".");
      let val = i18n[lang]?.[arr[0]];
      for (let i = 1; i < arr.length; i++) {
        val = val?.[arr[i]];
      }
      if (!val) return text; // çeviri bulunamazsa key'i döndür
      val = val + "";
      for (let i = 0; i < params.length; i++) {
        val = val.replace("${}", params[i]);
      }
      return val;
    } catch {
      return text; // hata durumunda key'i döndür
    }
  }
}

module.exports = I18n;
