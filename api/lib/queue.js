const { Queue, Worker } = require("bullmq");
const { Redis } = require("ioredis");
const EmailService = require("./email");

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {},
});

// Email queue
const emailQueue = new Queue("email", { connection });

// Email worker — queue'daki işleri işler
const emailWorker = new Worker(
  "email",
  async (job) => {
    const { type, to, token } = job.data;

    if (type === "password_reset") {
      await EmailService.sendPasswordReset(to, token);
    } else if (type === "email_verification") {
      await EmailService.sendEmailVerification(to, token);
    }
  },
  {
    connection,
    attempts: 3, // başarısız olursa 3 kez dene
    backoff: {
      type: "exponential",
      delay: 1000, // 1s, 2s, 4s
    },
  },
);

emailWorker.on("completed", (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Email job ${job.id} failed:`, err.message);
});

module.exports = { emailQueue };
