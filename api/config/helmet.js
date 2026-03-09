const helmet = require("helmet");

module.exports = helmet({
  crossOriginResourcePolicy: false, // React Native için gerekli

  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },

  hsts: {
    maxAge: 31536000, // 1 yıl
    includeSubDomains: true,
    preload: true,
  },

  frameguard: { action: "deny" }, // clickjacking koruması
  noSniff: true, // MIME type sniffing koruması
  xssFilter: true, // XSS koruması
});
