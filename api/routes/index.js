var express = require("express");
var router = express.Router();

// Router yapısını dinamik olarak oluşturmak için routes klasöründeki tüm dosyaları okuyarak işlemi gerçekleştirebiliriz. Bu sayede yeni bir route eklediğimizde sadece ilgili dosyayı oluşturup içine gerekli kodları yazmamız yeterli olacaktır.

const fs = require("fs");
let routes = fs.readdirSync(__dirname);
for (let route of routes) {
  if (route.endsWith(".js") && route !== "index.js") {
    try {
      router.use("/" + route.replace(".js", ""), require("./" + route));
    } catch (err) {
      console.error(`Route yüklenemedi: ${route}`, err);
    }
  }
}

module.exports = router;
