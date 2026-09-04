// Copies the static frontend files (HTML, CSS) next to the tsc-compiled JS in
// dist/frontend/, so dist/frontend/ is a self-contained static bundle Vercel
// can serve directly. Rewrites index.html's asset paths to be absolute
// (/frontend/...) rather than relative: Vercel serves this file at "/" via a
// rewrite (not a redirect), so the browser's URL stays at "/" and relative
// paths like "./app.js" would resolve against "/" instead of "/frontend/".
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "node:fs";

mkdirSync("dist/frontend", { recursive: true });

const html = readFileSync("src/frontend/index.html", "utf8")
    .replace('src="../../dist/frontend/app.js"', 'src="/frontend/app.js"')
    .replace('href="./styles.css"', 'href="/frontend/styles.css"');
writeFileSync("dist/frontend/index.html", html);

copyFileSync("src/frontend/styles.css", "dist/frontend/styles.css");
