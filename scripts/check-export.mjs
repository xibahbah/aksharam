import assert from "node:assert/strict";
import { readFile, access, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { createExportServer, BASE_PATH } from "./serve-export.mjs";

const root = fileURLToPath(new URL("../out/", import.meta.url));
const routes = [
  "",
  "flashcards/",
  "learn/",
  "practice/",
  "test/",
  "reference/",
  "settings/",
];
const assets = new Set();
const links = new Set();
const payloads = new Set();

async function collectPayloads(directory = "") {
  for (const entry of await readdir(resolve(root, directory), {
    withFileTypes: true,
  })) {
    const relative = `${directory}${entry.name}`;
    if (entry.isDirectory()) await collectPayloads(`${relative}/`);
    else if (entry.name.endsWith(".txt"))
      payloads.add(`${BASE_PATH}/${relative}`);
    // Include lazy JS chunks and assets not present in initial-page markup.
    else if (relative.startsWith("_next/static/"))
      assets.add(`${BASE_PATH}/${relative}`);
  }
}
await collectPayloads();
await access(resolve(root, ".nojekyll"));
for (const route of routes) {
  const pathname = `${BASE_PATH}/${route}`;
  const html = await readFile(resolve(root, route, "index.html"), "utf8");
  const { document } = new JSDOM(html).window;
  assert.ok(document.querySelector("main"), `Missing page content: ${route}`);
  const appearance = document.head.querySelector("script#appearance-init");
  assert.ok(
    appearance?.textContent?.includes("aksharam.appearance.v1"),
    `Missing early appearance script: ${route}`,
  );
  assert.ok(
    appearance.textContent.includes("prefers-color-scheme"),
    `Missing System appearance bootstrap: ${route}`,
  );
  const viewport =
    document.querySelector('meta[name="viewport"]')?.getAttribute("content") ??
    "";
  assert.match(
    viewport,
    /width=device-width/,
    `Missing device viewport: ${route}`,
  );
  assert.match(
    viewport,
    /viewport-fit=cover/,
    `Missing safe-area viewport: ${route}`,
  );
  assert.doesNotMatch(
    viewport,
    /user-scalable=no|maximum-scale=1(?:,|$)/,
    `Pinch zoom disabled: ${route}`,
  );
  for (const node of document.querySelectorAll(
    "a[href],script[src],link[href],img[src],source[src],audio[src]",
  )) {
    const value = node.getAttribute(
      node.tagName === "A" || node.tagName === "LINK" ? "href" : "src",
    );
    if (!value || /^(?:https?:|data:|blob:|mailto:|tel:|#|\/\/)/i.test(value))
      continue;
    const url = new URL(value, `https://nivupai.github.io${pathname}`);
    assert.ok(
      url.pathname.startsWith(`${BASE_PATH}/`),
      `Unprefixed URL on ${pathname}: ${value}`,
    );
    const local = decodeURIComponent(url.pathname.slice(BASE_PATH.length + 1));
    const target = resolve(
      root,
      local,
      url.pathname.endsWith("/") ? "index.html" : "",
    );
    await access(target).catch(() => {
      throw new Error(`Missing target for ${value} on ${pathname}`);
    });
    (node.tagName === "A" ? links : assets).add(url.pathname);
  }
}
// Follow compiled CSS font/image URLs, including relative ../media font files.
for (const pathname of [...assets].filter((p) => p.endsWith(".css"))) {
  const file = resolve(root, pathname.slice(BASE_PATH.length + 1));
  const css = await readFile(file, "utf8");
  for (const match of css.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) {
    const value = match[1];
    if (/^(?:data:|https?:|#)/.test(value)) continue;
    const url = new URL(value, `https://nivupai.github.io${pathname}`);
    assert.ok(
      url.pathname.startsWith(`${BASE_PATH}/`),
      `Unprefixed CSS resource: ${value}`,
    );
    await access(
      resolve(
        root,
        decodeURIComponent(url.pathname.slice(BASE_PATH.length + 1)),
      ),
    );
    assets.add(url.pathname);
  }
}
// Check actual HTTP responses from the exported files, not a Next server or SPA fallback.
const server = createExportServer();
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
try {
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const path of new Set([
    ...routes.map((r) => `${BASE_PATH}/${r}`),
    ...links,
    ...assets,
    ...payloads,
  ])) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 200, `Static request failed: ${path}`);
  }
  // Outside-the-project paths only exist when the site has a sub-path.
  const outside = BASE_PATH ? ["/", "/learn/"] : [];
  for (const path of [...outside, `${BASE_PATH}/does-not-exist/`]) {
    assert.equal(
      (await fetch(`${origin}${path}`)).status,
      404,
      `Unexpected SPA fallback: ${path}`,
    );
  }
  console.log(
    `Static export verified: ${routes.length} direct routes, ${links.size} navigation targets, ${assets.size} JS/CSS/font assets, ${payloads.size} client navigation payloads; no SPA fallback. .nojekyll present.`,
  );
} finally {
  await new Promise((resolve) => server.close(resolve));
}
