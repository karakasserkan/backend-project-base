const request = require("supertest");
const app = require("../app");

describe("Health Check", () => {
  it("GET /api/health — should return 200 or 503", async () => {
    const res = await request(app).get("/api/health");
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.services.database).toBeDefined();
  });
});
