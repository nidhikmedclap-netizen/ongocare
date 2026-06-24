#!/usr/bin/env node
/**
 * Seed chatSites for multi-brand widget bootstrap.
 *
 * Usage:
 *   node scripts/seedChatSites.js
 *
 * Env:
 *   CHAT_SITE_SEEDS=weightloss-main=weightloss:weightloss.com|www.weightloss.com,ongo-homepage=ongo:ongo.com
 */
require("dotenv").config();

const { initFirebaseAdmin } = require("../lib/firebase");
const ChatSiteRepository = require("../channels/chat/repositories/ChatSiteRepository");

function parseSiteSeeds(raw) {
  const seeds = [];
  const text = String(raw || "").trim();
  if (!text) return seeds;

  for (const entry of text.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const [sitePart, rest] = trimmed.split("=");
    const [orgPart, domainsPart] = String(rest || "").split(":");
    const siteKey = String(sitePart || "").trim().toLowerCase();
    const orgSlug = String(orgPart || "").trim().toLowerCase();
    const domains = String(domainsPart || "")
      .split("|")
      .map((value) => value.trim())
      .filter(Boolean);

    if (!siteKey || !orgSlug) {
      console.warn("[seed] skipping invalid chat site entry:", trimmed);
      continue;
    }

    seeds.push({ siteKey, orgSlug, domains });
  }

  return seeds;
}

async function main() {
  initFirebaseAdmin();

  const seeds = parseSiteSeeds(process.env.CHAT_SITE_SEEDS);
  if (!seeds.length) {
    seeds.push({
      siteKey: "weightloss-main",
      orgSlug: "weightloss",
      domains: ["weightloss.com", "www.weightloss.com", "localhost"],
    });
    seeds.push({
      siteKey: "ongo-homepage",
      orgSlug: "ongo",
      domains: ["ongo.com", "www.ongo.com", "localhost"],
    });
  }

  const repo = new ChatSiteRepository();
  for (const seed of seeds) {
    const theme = seed.siteKey === "weightloss-main"
      ? {
          primaryColor: "#0f766e",
          accentColor: "#14b8a6",
          headerTitle: "Weightloss Support",
          launcherLabel: "Chat",
          welcomeMessage: "Ask us anything about your weight loss journey.",
        }
      : {
          primaryColor: "#1d4ed8",
          accentColor: "#3b82f6",
          headerTitle: "Ongo Support",
          launcherLabel: "Chat",
          welcomeMessage: "How can we help you today?",
        };

    const result = await repo.upsert(seed.siteKey, {
      orgSlug: seed.orgSlug,
      name: seed.siteKey,
      domains: seed.domains,
      status: "active",
      theme,
    });
    console.log(
      `[seed] chatSites/${result.id} ${result.created ? "created" : "updated"}`,
    );
  }

  console.log("[seed] done");
}

main().catch((error) => {
  console.error("[seed] failed:", error.message || error);
  process.exit(1);
});
