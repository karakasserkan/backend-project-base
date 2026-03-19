const request = require("supertest");
const app = require("../app");

let token;
let categoryId;

describe("Categories", () => {
  beforeAll(async () => {
    const res = await request(app)
      .post("/api/users/auth")
      .send({ email: "testuser@test.com", password: "Test1234!" });
    token = res.body.data.token;
  }, 30000);

  it("POST /api/categories/add — should add category", async () => {
    const res = await request(app)
      .post("/api/categories/add")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Kategori" });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("GET /api/categories — should list categories", async () => {
    const res = await request(app)
      .get("/api/categories")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.data.length).toBeGreaterThan(0);
    categoryId = res.body.data.data[0]._id;
  });

  it("POST /api/categories/update — should update category", async () => {
    const res = await request(app)
      .post("/api/categories/update")
      .set("Authorization", `Bearer ${token}`)
      .send({ _id: categoryId, name: "Güncellenmiş Kategori" });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("DELETE /api/categories/delete — should delete category", async () => {
    const res = await request(app)
      .delete("/api/categories/delete")
      .set("Authorization", `Bearer ${token}`)
      .send({ _id: categoryId });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
