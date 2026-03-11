const express = require("express");
const router = express.Router();
const { HTTP_CODES } = require("../config/Enum");
const emitter = require("../lib/Emitter");
const auth = require("../lib/auth")();

// Emitter yoksa oluştur
if (!emitter.getEmitter("notifications")) {
  emitter.addEmitter("notifications");
}

//SWAGGER
/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Server-Sent Events — gerçek zamanlı bildirimler
 */

/**
 * @swagger
 * /events:
 *   get:
 *     summary: SSE bağlantısı kur, gerçek zamanlı bildirimleri dinle
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: SSE stream başladı
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: "data:{\"message\":\"kategori 1 is added\"}\n\n"
 *       401:
 *         description: Yetkisiz
 */

// ─── PROTECTED ENDPOINTS
//Auth koruması eklendi
router.get("/", auth.authenticate(), (req, res) => {
  res.writeHead(HTTP_CODES.OK, {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache, no-transform",
  });

  res.flushHeaders();

  const listener = (data) => {
    res.write(`data:${JSON.stringify(data)}\n\n`);
  };

  emitter.getEmitter("notifications").on("messages", listener);

  req.on("close", () => {
    emitter.getEmitter("notifications").off("messages", listener);
  });
});

module.exports = router;
