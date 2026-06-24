import { build, context } from "esbuild";
import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(
  __dirname,
  "../../backend/communications-service/public/widget",
);
const watch = process.argv.includes("--watch");

const buildOptions = {
  entryPoints: [path.join(__dirname, "src/index.js")],
  bundle: true,
  format: "iife",
  globalName: "OngoChatBundle",
  outfile: path.join(outDir, "ongocare-chat.js"),
  minify: !watch,
  sourcemap: watch,
  target: ["es2018"],
  legalComments: "none",
};

async function run() {
  await mkdir(outDir, { recursive: true });

  if (watch) {
    const ctx = await context(buildOptions);
    await ctx.watch();
    console.log("[chat-widget] watching", outDir);
    return;
  }

  await build(buildOptions);
  await copyFile(
    path.join(__dirname, "embed.html"),
    path.join(outDir, "embed.html"),
  );
  console.log("[chat-widget] built", path.join(outDir, "ongocare-chat.js"));
}

run().catch((error) => {
  console.error("[chat-widget] build failed", error);
  process.exit(1);
});
