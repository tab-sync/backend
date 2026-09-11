import { createApp } from "./app";
import { createDatabase } from "./db";

const port = Number(Bun.env.PORT ?? 3000);
const databasePath = Bun.env.DATABASE_PATH ?? "tabsync.sqlite";
const database = createDatabase(databasePath);
const fetch = createApp({ database });

Bun.serve({ hostname: "127.0.0.1", port, fetch });
console.log(`Tab Sync API listening on http://127.0.0.1:${port}`);
