import express, { type Request, type Response } from "express";
import { fetchForecast, searchCities, WeatherApiError } from "./weatherApi.js";
import { fetchBackgroundPhotoUrl } from "./backgroundPhotoApi.js";

const projectRoot = process.cwd();

const WEATHER_API_KEY = process.env["WEATHER_API_KEY"];
const PIXABAY_API_KEY = process.env["PIXABAY_API_KEY"];

if (!WEATHER_API_KEY) {
    throw new Error("Missing WEATHER_API_KEY environment variable (see .env.example)");
}

const PORT = process.env["PORT"] ? Number(process.env["PORT"]) : 5500;

const app = express();
app.use(express.static(projectRoot));

app.get("/api/weather", async (req: Request, res: Response) => {
    const location = typeof req.query["location"] === "string" ? req.query["location"] : "Lyon";
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
    const query = typeof req.query["q"] === "string" ? req.query["q"] : "";
    if (query.trim().length < 2) {
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
    const category = typeof req.query["category"] === "string" ? req.query["category"] : "";
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

if (!process.env["VERCEL"]) {
    app.listen(PORT, () => {
        console.log(`Weather app running at http://localhost:${PORT}`);
    });
}

export default app;
