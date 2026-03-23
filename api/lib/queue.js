const { Queue, Worker } = require("bullmq");
const { Redis } = require("ioredis");
const EmailService = require("./email");

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: process.env.NODE_ENV === "production" ? {} : undefined,
  lazyConnect: true,
  enableOfflineQueue: false,
});

connection.on("error", () => {
  // Redis bağlantı hatalarını sessizce geç
});

const emailQueue = new Queue("email", {
  connection,
  defaultJobOptions: { attempts: 1 },
});

emailQueue.on("error", () => {
  // Queue hatalarını sessizce geç
});

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
    concurrency: 1,
  },
);

emailWorker.on("error", () => {
  // Worker hatalarını sessizce geç
});

emailWorker.on("completed", (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err.message);
});

module.exports = { emailQueue };
