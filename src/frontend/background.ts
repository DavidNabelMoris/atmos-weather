import { categorize, type Category } from "./weatherCategories.js";
import { currentCity } from "./app.js";
import type { WeatherResponse } from "./app.js";


const BACKEND_CATEGORY: Record<Category, { day: string; night: string }> = {
    "clear": { day: "Sunny", night: "Clear" },
    "partly-cloudy": { day: "Partly_CloudyDay", night: "Partly_CloudyNight" },
    "cloudy": { day: "Cloudy_Day", night: "Cloudy_Night" },
    "overcast": { day: "Overcast_Day", night: "Overcast_Night" },
    "fog": { day: "Fog_Day", night: "Fog_Night" },
    "drizzle": { day: "Drizzle_Day", night: "Drizzle_Night" },
    "rain": { day: "Rain_Day", night: "Rain_Night" },
    "sleet": { day: "Sleet_Day", night: "Sleet_Night" },
    "snow": { day: "Snow_Day", night: "Snow_Night" },
    "thunderstorm": { day: "Thunderstorm_Day", night: "Thunderstorm_Night" },
};


function getViewportRatio(): number {
    return window.innerWidth / window.innerHeight;
}

// Bucket to the nearest tenth so small resizes reuse the cache, while a real
// shape change (rotating a phone, resizing/zooming a window) still refetches.
function ratioBucket(ratio: number): string {
    return (Math.round(ratio * 10) / 10).toFixed(1);
}

export async function fetchBackgroundPhoto(category: string, city: string, ratio: number): Promise<string | null> {
    const res = await fetch(`/api/background-photo?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}&ratio=${ratio}`);
    if (!res.ok) {
        return null;
    }
    const data = (await res.json()) as { url: string | null };
    return data.url;
}

const photoCache = new Map<string, string | null>();
let latestRequestId = 0;
let lastApplied: { code: number; isDay: boolean; data: WeatherResponse } | null = null;

export async function applyBackgroundPhoto(code: number, isDay: boolean, data: WeatherResponse): Promise<void> {
    lastApplied = { code, isDay, data };
    const { category } = categorize(code, isDay);
    const backendCategory = BACKEND_CATEGORY[category][isDay ? "day" : "night"];
    const city = String(currentCity(data));
    const ratio = getViewportRatio();
    const cacheKey = `${backendCategory}:${ratioBucket(ratio)}`;
    const requestId = ++latestRequestId;

    let url = photoCache.get(cacheKey);
    if (url === undefined) {
        url = await fetchBackgroundPhoto(backendCategory, city, ratio);
        photoCache.set(cacheKey, url);
    }

    if (requestId !== latestRequestId) return;

    document.body.style.backgroundImage = url
        ? `linear-gradient(var(--background-overlay), var(--background-overlay)), url('${url}')`
        : "";
}

// Re-pick a better-matching photo when the viewport's shape actually changes
// (resize, browser zoom, orientation change) instead of keeping a stale crop.
let resizeTimer: number | undefined;
window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
        if (lastApplied) void applyBackgroundPhoto(lastApplied.code, lastApplied.isDay, lastApplied.data);
    }, 400);
});
