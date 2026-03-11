const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Backend Project Base API",
      version: "1.0.0",
      description: "Backend Boilerplate API Documentation",
    },

    servers: [
      {
        url: `http://localhost:${process.env.PORT}/api`,
        description: "Development server",
      },
    ],

    tags: [
      { name: "Users", description: "Kullanıcı işlemleri" },
      { name: "Roles", description: "Rol işlemleri" },
      { name: "Categories", description: "Kategori işlemleri" },
      { name: "AuditLogs", description: "Log kayıtları" },
      { name: "Stats", description: "İstatistik ve raporlama" },
      { name: "Events", description: "Gerçek zamanlı bildirimler" },
      { name: "Health", description: "Sistem sağlık kontrolü" },
    ],

    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },

      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            code: {
              type: "number",
              example: 200,
            },
            data: {
              type: "object",
            },
          },
        },

        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            code: {
              type: "number",
              example: 400,
            },
            error: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
              },
            },
          },
        },
      },
    },

    security: [
      {
        BearerAuth: [],
      },
    ],
  },

  apis: ["./routes/*.js"],
};

module.exports = swaggerJsdoc(options);
