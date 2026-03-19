const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");

const testUser = {
  email: "testuser@test.com",
  password: "Test1234!",
  first_name: "Test",
  last_name: "User",
};

let token;

describe("Auth", () => {
  beforeAll(async () => {
    // Biraz bekle — DB bağlantısı kurulsun
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const mongoose = require("mongoose");
    await mongoose.connection.collection("users").deleteMany({});
    await mongoose.connection.collection("roles").deleteMany({});
    await mongoose.connection.collection("userroles").deleteMany({});
    await mongoose.connection.collection("roleprivileges").deleteMany({});
  }, 30000);

  it("POST /api/users/register — should register first admin user", async () => {
    const res = await request(app).post("/api/users/register").send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/users/register — should fail if user already exists", async () => {
    const res = await request(app).post("/api/users/register").send(testUser);
    expect(res.statusCode).toBe(403);
  });

  it("POST /api/users/auth — should login and return token", async () => {
    const res = await request(app)
      .post("/api/users/auth")
      .send({ email: testUser.email, password: testUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
    token = res.body.data.token;
  });

  it("POST /api/users/auth — should fail with wrong password", async () => {
    const res = await request(app)
      .post("/api/users/auth")
      .send({ email: testUser.email, password: "wrongpassword" });
    expect(res.statusCode).toBe(401);
  });

  it("POST /api/users/logout — should logout successfully", async () => {
    const res = await request(app)
      .post("/api/users/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.message).toBe("Logged out successfully");
  });
});
