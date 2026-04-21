#!/usr/bin/env node
// Run with: node scripts/setup-db.mjs
// This script pushes the Prisma schema to your database and triggers the first scrape.

import { execSync } from "child_process";

const BASE_URL = process.env.APP_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET || "";

console.log("🗄️  Pushing Prisma schema to database...");
try {
  execSync("npx prisma db push", { stdio: "inherit" });
  console.log("✅ Schema pushed successfully.\n");
} catch {
  console.error("❌ Failed to push schema. Check your DATABASE_URL in .env");
  process.exit(1);
}

console.log(`🕷️  Triggering first scrape at ${BASE_URL}/api/scrape ...`);
try {
  const res = await fetch(`${BASE_URL}/api/scrape`, {
    method: "POST",
    headers: CRON_SECRET ? { Authorization: `Bearer ${CRON_SECRET}` } : {},
  });
  const json = await res.json();
  if (res.ok) {
    console.log(`✅ Scrape complete: ${json.found} tournaments found, ${json.updated} updated.`);
  } else {
    console.error("❌ Scrape failed:", json);
  }
} catch (err) {
  console.log("ℹ️  Could not reach the app — run the scrape manually after deployment:");
  console.log(`   curl -X POST ${BASE_URL}/api/scrape -H "Authorization: Bearer $CRON_SECRET"`);
}
