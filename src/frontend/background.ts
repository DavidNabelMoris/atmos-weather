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


export async function fetchBackgroundPhoto(category: string, city: string): Promise<string | null> {
    const res = await fetch(`/api/background-photo?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}`);
    if (!res.ok) {
        return null;
    }
    const data = (await res.json()) as { url: string | null };
    return data.url;
}

const photoCache = new Map<string, string | null>();
let latestRequestId = 0;

export async function applyBackgroundPhoto(code: number, isDay: boolean, data: WeatherResponse): Promise<void> {
    const { category } = categorize(code, isDay);
    const backendCategory = BACKEND_CATEGORY[category][isDay ? "day" : "night"];
    const city =  String(currentCity(data)); 
    const requestId = ++latestRequestId;

    let url = photoCache.get(backendCategory);
    if (url === undefined) {
        url = await fetchBackgroundPhoto(backendCategory,city);
        photoCache.set(backendCategory, url);
    }

    if (requestId !== latestRequestId) return;

    document.body.style.backgroundImage = url
        ? `linear-gradient(var(--background-overlay), var(--background-overlay)), url('${url}')`
        : "";
}
