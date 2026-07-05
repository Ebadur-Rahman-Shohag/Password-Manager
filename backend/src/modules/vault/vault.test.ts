import { describe, it, expect } from "vitest";
import request, { type Agent } from "supertest";
import { app } from "../../app";

async function registerAgent(email: string): Promise<Agent> {
  const agent = request.agent(app);
  await agent.post("/auth/register").send({ email, password: "password123" });
  return agent;
}

describe("vault API", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/vault");
    expect(res.status).toBe(401);
  });

  it("creates and lists encrypted vault entries", async () => {
    const agent = await registerAgent("vault@test.com");

    const create = await agent
      .post("/vault")
      .send({ encryptedData: { ciphertext: "cipher", iv: "ivvalue12" } });

    expect(create.status).toBe(201);
    expect(create.body.encryptedData.ciphertext).toBe("cipher");

    const list = await agent.get("/vault");

    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });

  it("scopes vault entries to the authenticated user", async () => {
    const agentA = await registerAgent("usera@test.com");
    const agentB = await registerAgent("userb@test.com");

    const create = await agentA
      .post("/vault")
      .send({ encryptedData: { ciphertext: "secret", iv: "ivvalue12" } });

    const entryId = create.body.id;

    const update = await agentB
      .put(`/vault/${entryId}`)
      .send({ encryptedData: { ciphertext: "hacked", iv: "ivvalue12" } });

    expect(update.status).toBe(404);
  });
});
