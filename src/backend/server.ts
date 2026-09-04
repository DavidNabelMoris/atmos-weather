import path from "node:path";
import express, { type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { fetchForecast, searchCities, WeatherApiError } from "./weatherApi.js";
import { fetchBackgroundPhotoUrl } from "./backgroundPhotoApi.js";

const projectRoot = process.cwd();

const WEATHER_API_KEY = process.env["WEATHER_API_KEY"];
const PIXABAY_API_KEY = process.env["PIXABAY_API_KEY"];

if (!WEATHER_API_KEY) {
    throw new Error("Missing WEATHER_API_KEY environment variable (see .env.example)");
}

const PORT = process.env["PORT"] ? Number(process.env["PORT"]) : 5500;
const MAX_QUERY_LENGTH = 100;

const app = express();

// In production, Vercel serves static assets directly and applies the header
// set in vercel.json instead of this middleware — keep the two in sync.
app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src https://fonts.gstatic.com; img-src 'self' https://pixabay.com https://cdn.pixabay.com data:; " +
        "connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=(), payment=()");
    res.setHeader("X-XSS-Protection", "0");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    next();
});

app.use(express.static(path.join(projectRoot, "src/frontend/public")));
app.use("/src", express.static(path.join(projectRoot, "src")));
app.use("/dist", express.static(path.join(projectRoot, "dist")));

const apiLimiter = rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api", apiLimiter);

function cleanQueryParam(value: unknown, fallback = ""): string {
    if (typeof value !== "string") return fallback;
    return value.trim().slice(0, MAX_QUERY_LENGTH);
}

app.get("/api/weather", async (req: Request, res: Response) => {
    const location = cleanQueryParam(req.query["location"], "Lyon") || "Lyon";
    try {
        const data = await fetchForecast(WEATHER_API_KEY, location);
        res.json(data);
    } catch (err) {
        if (err instanceof WeatherApiError) {
            res.status(err.status).json({ error: err.message });
            return;
        }
        console.error(err);
        res.status(502).json({ error: "Failed to fetch weather data" });
    }
});

app.get("/api/search-cities", async (req: Request, res: Response) => {
    const query = cleanQueryParam(req.query["q"]);
    if (query.length < 2) {
        res.json([]);
        return;
    }
    try {
        const cities = await searchCities(WEATHER_API_KEY, query);
        res.json(cities);
    } catch (err) {
        if (err instanceof WeatherApiError) {
            res.status(err.status).json({ error: err.message });
            return;
        }
        console.error(err);
        res.status(502).json({ error: "Failed to fetch city suggestions" });
    }
});

app.get("/api/background-photo", async (req: Request, res: Response) => {
    if (!PIXABAY_API_KEY) {
        res.status(503).json({ error: "Missing PIXABAY_API_KEY environment variable" });
        return;
    }
    const category = cleanQueryParam(req.query["category"]);
    try {
        const url = await fetchBackgroundPhotoUrl(PIXABAY_API_KEY, category);
        res.json({ url });
    } catch (err) {
        console.error(err);
        res.status(502).json({ error: "Failed to fetch background photo" });
    }
});

app.get("/", (_req: Request, res: Response) => {
    res.redirect("/src/frontend/index.html");
});

app.get("/parallax", (_req: Request, res: Response) => {
    res.redirect("/src/frontend/parallax.html");
});

app.use((_req: Request, res: Response) => {
    res.status(404).sendFile(path.join(projectRoot, "src/frontend/404.html"));
});

// Express's default error handler leaks stack traces; this one only logs them server-side.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
});

if (!process.env["VERCEL"]) {
    app.listen(PORT, () => {
        console.log(`Weather app running at http://localhost:${PORT}`);
    });
}

export default app;
