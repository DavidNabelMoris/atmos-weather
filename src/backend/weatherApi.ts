const WEATHER_API_BASE = "https://api.weatherapi.com/v1";

export class WeatherApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = "WeatherApiError";
    }
}

export async function fetchForecast(apiKey: string, location: string): Promise<unknown> {
    const url = `${WEATHER_API_BASE}/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=3&aqi=yes&alerts=yes&lang=fr`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new WeatherApiError(res.status, `Weather API error: ${res.status}`);
    }
    return res.json();
}


export interface CitySuggestion {
    name: string;
    region: string;
    country: string;
}

export async function searchCities(apiKey: string, query: string): Promise<CitySuggestion[]> {
    const url = `${WEATHER_API_BASE}/search.json?key=${apiKey}&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new WeatherApiError(res.status, `Weather API error: ${res.status}`);
    }
    return res.json() as Promise<CitySuggestion[]>;
}
