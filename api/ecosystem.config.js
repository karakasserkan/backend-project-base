module.exports = {
  apps: [
    {
      name: "backend-project-base",
      script: "./bin/www",
      instances: "max", // CPU core sayısı kadar instance
      exec_mode: "cluster", // load balancing
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
