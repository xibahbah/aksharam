import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

// A plain file server mounted exactly like GitHub project Pages. No SPA rewrites.
const configured = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/aksharam")
  .trim()
  .replace(/^\/+|\/+$/g, "");
export const BASE_PATH = configured ? `/${configured}` : "";
const root = fileURLToPath(new URL("../out/", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
};
export function createExportServer() {
  return http.createServer(async (req, res) => {
    try {
      if (!["GET", "HEAD"].includes(req.method)) {
        res.writeHead(405);
        res.end();
        return;
      }
      const url = new URL(req.url, "http://localhost");
      if (url.pathname === BASE_PATH) {
        res.writeHead(308, { Location: `${BASE_PATH}/${url.search}` });
        res.end();
        return;
      }
      if (!url.pathname.startsWith(`${BASE_PATH}/`))
        throw new Error("Outside project");
      const path = resolve(
        root,
        `.${decodeURIComponent(url.pathname.slice(BASE_PATH.length))}`,
      );
      if (
        path !== root.slice(0, -1) &&
        !path.startsWith(`${resolve(root)}${sep}`)
      )
        throw new Error("Outside export");
      let target = path;
      const info = await stat(target);
      if (info.isDirectory()) {
        if (!url.pathname.endsWith("/")) {
          res.writeHead(308, { Location: `${url.pathname}/${url.search}` });
          res.end();
          return;
        }
        target = resolve(target, "index.html");
      }
      const data = await readFile(target);
      res.writeHead(200, {
        "Content-Type": types[extname(target)] ?? "application/octet-stream",
        "Content-Length": data.length,
      });
      res.end(req.method === "HEAD" ? undefined : data);
    } catch {
      const data = await readFile(resolve(root, "404.html")).catch(() =>
        Buffer.from("Not found"),
      );
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(req.method === "HEAD" ? undefined : data);
    }
  });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const server = createExportServer();
  const port = Number(process.env.PORT ?? 3000);
  server.listen(port, "127.0.0.1", () =>
    console.log(
      `Static Aksharam preview: http://localhost:${port}${BASE_PATH}/`,
    ),
  );
}
