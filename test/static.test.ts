import { describe, expect, test } from "bun:test";
import { createApp } from "../src/app";
import { createDatabase } from "../src/db";
import { createWebFetch } from "../src/static";

function handler() {
  const database = createDatabase(":memory:");
  const api = createApp({ database });
  return { database, fetch: createWebFetch(api) };
}

describe("web assets", () => {
  test("serves dashboard pages and relocated assets", async () => {
    const { database, fetch } = handler();
    try {
      const root = await fetch(new Request("http://localhost/"));
      expect(root.status).toBe(200);
      expect(root.headers.get("content-type")).toBe("text/html; charset=utf-8");
      expect(root.headers.get("content-security-policy")).toContain("default-src 'self'");
      expect(await root.text()).toContain("Tab Sync");

      const icon = await fetch(new Request("http://localhost/assets/icon.svg"));
      expect(icon.status).toBe(200);
      expect(icon.headers.get("content-type")).toBe("image/svg+xml");
    } finally {
      database.close();
    }
  });

  test("supports HEAD and keeps non-GET requests with the API", async () => {
    const { database, fetch } = handler();
    try {
      const head = await fetch(new Request("http://localhost/privacy", { method: "HEAD" }));
      expect(head.status).toBe(200);
      expect(await head.text()).toBe("");

      const post = await fetch(new Request("http://localhost/", { method: "POST" }));
      expect(post.status).toBe(404);
    } finally {
      database.close();
    }
  });
});
