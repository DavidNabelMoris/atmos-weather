// Copies the static frontend files (HTML, CSS) next to the tsc-compiled JS in
// dist/frontend/, so dist/frontend/ is a self-contained static bundle Vercel
// can serve directly. Rewrites each page's asset/nav paths to be absolute
// (/frontend/..., /) rather than relative: Vercel serves index.html at "/" via
// a rewrite (not a redirect), so the browser's URL stays at "/" and relative
// paths like "./app.js" would resolve against "/" instead of "/frontend/".
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, readdirSync } from "node:fs";

mkdirSync("dist/frontend", { recursive: true });

function writePage(name, replacements) {
    let html = readFileSync(`src/frontend/${name}`, "utf8");
    for (const [from, to] of replacements) html = html.replaceAll(from, to);
    writeFileSync(`dist/frontend/${name}`, html);
}

const linkRewrites = [
    ['src="../../dist/frontend/app.js"', 'src="/frontend/app.js"'],
    ['href="./styles.css"', 'href="/frontend/styles.css"'],
    ['href="./index.html"', 'href="/"'],
    ['href="./privacy.html"', 'href="/frontend/privacy.html"'],
    ['href="./terms.html"', 'href="/frontend/terms.html"'],
];

for (const page of ["index.html", "privacy.html", "terms.html", "404.html"]) {
    writePage(page, linkRewrites);
}

copyFileSync("src/frontend/styles.css", "dist/frontend/styles.css");

// Root-level SEO/well-known files (robots.txt, sitemap.xml, favicon.svg, llms.txt)
// must live at the output directory's root, not under /frontend/, since they're
// requested at fixed top-level paths (e.g. /robots.txt).
for (const file of readdirSync("src/frontend/public")) {
    copyFileSync(`src/frontend/public/${file}`, `dist/${file}`);
}

// Vercel serves dist/404.html automatically for any unmatched static path.
copyFileSync("dist/frontend/404.html", "dist/404.html");
