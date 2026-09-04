import { categorize, type Category } from "./weatherCategories.js";
import {
    conditionIconFor, dropletIcon, cloudRainIcon, windIcon, sunIcon, eyeIcon,
    sunriseIcon, sunsetIcon, moonIcon, warningIcon,
} from "./icons.js";

import { applyBackgroundPhoto } from "./background.js";

let location = "Lyon";
let lastData: WeatherResponse | null = null;
let currentTzId = Intl.DateTimeFormat().resolvedOptions().timeZone;

function updateClock(): void {
    const now = new Date();
    qs<HTMLDivElement>("localTime").textContent = new Intl.DateTimeFormat("fr-FR", {
        timeZone: currentTzId, hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(now);
    qs<HTMLDivElement>("localDate").textContent = new Intl.DateTimeFormat("fr-FR", {
        timeZone: currentTzId, weekday: "long", day: "numeric", month: "long",
    }).format(now);

    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: currentTzId, hour: "2-digit", minute: "2-digit", hour12: false,
    }).formatToParts(now);
    // hour12:false can report midnight as "24" in some engines; %24 normalizes that to 0.
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);

    const hourAngle = (hour % 12) * 30 + minute * 0.5;
    const minuteAngle = minute * 6;
    qs<SVGLineElement>("clockHourHand").setAttribute("transform", `rotate(${hourAngle} 12 12)`);
    qs<SVGLineElement>("clockMinuteHand").setAttribute("transform", `rotate(${minuteAngle} 12 12)`);
}

interface CitySuggestion {
    name: string;
    region: string;
    country: string;
}

interface HourData {
    time: string;
    temp_c: number;
    condition: { code: number };
    chance_of_rain: number;
    chance_of_snow: number;
}

interface ForecastDay {
    date: string;
    day: {
        maxtemp_c: number;
        mintemp_c: number;
        condition: { code: number };
        daily_chance_of_rain: number;
        daily_chance_of_snow: number;
    };
    astro: {
        sunrise: string;
        sunset: string;
        moon_phase: string;
        moon_illumination: number;
    };
    hour: HourData[];
}

export interface WeatherResponse {
    location: {
        name: string;
        country: string;
        tz_id: string;
    };
    current: {
        temp_c: number;
        feelslike_c: number;
        humidity: number;
        wind_kph: number;
        wind_dir: string;
        gust_kph: number;
        vis_km: number;
        uv: number;
        is_day: number;
        condition: { text: string; code: number };
        air_quality?: Record<string, number>;
    };
    forecast: { forecastday: ForecastDay[] };
    alerts?: { alert: { headline: string }[] };
}

const CATEGORY_BODY_CLASS: Record<Category, string> = {
    "clear": "weather-clear",
    "partly-cloudy": "weather-cloudy",
    "cloudy": "weather-cloudy",
    "overcast": "weather-cloudy",
    "fog": "weather-cloudy",
    "drizzle": "weather-rain",
    "rain": "weather-rain",
    "sleet": "weather-rain",
    "snow": "weather-snow",
    "thunderstorm": "weather-storm",
};

function qs<T extends Element>(id: string): T {
    return document.getElementById(id) as unknown as T;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function conditionIconHtml(code: number, isDay: boolean): string {
    const { category } = categorize(code, isDay);
    console.log(category);
    return conditionIconFor(category, isDay);
}

function applyBackground(code: number, isDay: boolean): void {
    const { category } = categorize(code, isDay);
    document.body.className = `${CATEGORY_BODY_CLASS[category]} ${isDay ? "day" : "night"}`;
}

function humiditySub(h: number): string {
    if (h < 30) return "Dry";
    if (h <= 60) return "Comfortable";
    return "Humid";
}

function uvSub(uv: number): string {
    if (uv < 3) return "Low";
    if (uv < 6) return "Moderate";
    if (uv < 8) return "High";
    if (uv < 11) return "Very High";
    return "Extreme";
}

function visSub(vis: number): string {
    if (vis >= 10) return "Clear";
    if (vis >= 5) return "Good";
    if (vis >= 2) return "Moderate";
    return "Poor";
}

function aqiLabel(index: number): { text: string; cls: string } {
    switch (index) {
        case 1: return { text: "Good AQI", cls: "badge-good" };
        case 2: return { text: "Moderate AQI", cls: "badge-good" };
        case 3: return { text: "Unhealthy (sensitive)", cls: "badge-warning" };
        case 4: return { text: "Unhealthy AQI", cls: "badge-warning" };
        case 5: return { text: "Very Unhealthy", cls: "badge-danger" };
        default: return { text: "Hazardous AQI", cls: "badge-danger" };
    }
}

function formatDayLabel(dateStr: string, index: number): string {
    if (index === 0) return "Today";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { weekday: "long" });
}

function buildSparklinePath(temps: number[], width: number, height: number): string {
    if (temps.length < 2) return "";
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const range = max - min || 1;
    const step = width / (temps.length - 1);
    const points = temps.map((t, i) => ({
        x: i * step,
        y: height - ((t - min) / range) * (height - 8) - 4,
    }));

    let d = `M ${points[0]!.x},${points[0]!.y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i]!;
        const p1 = points[i + 1]!;
        const midX = (p0.x + p1.x) / 2;
        d += ` C ${midX},${p0.y} ${midX},${p1.y} ${p1.x},${p1.y}`;
    }
    return d;
}

function getUpcomingHours(days: ForecastDay[]): HourData[] {
    const now = new Date();
    const currentHour = now.getHours();
    const today = days[0]!.hour;
    const tomorrow = days[1]?.hour ?? [];
    const hours: HourData[] = [];
    for (let offset = 0; offset < 13; offset++) {
        const i = currentHour + offset;
        const hour = i < 24 ? today[i] : tomorrow[i - 24];
        if (hour) hours.push(hour);
    }
    return hours;
}

const HOUR_ITEM_WIDTH = 64;

function buildHourLine(hours: HourData[], cellHtml: (h: HourData) => string): HTMLDivElement {
    const line = document.createElement("div");
    line.className = "hour-line";
    hours.forEach((h) => {
        const item = document.createElement("div");
        item.className = "hour-item";
        item.style.width = `${HOUR_ITEM_WIDTH}px`;
        item.innerHTML = cellHtml(h);
        line.appendChild(item);
    });
    return line;
}

function renderHourly(days: ForecastDay[]): void {
    const row = qs<HTMLDivElement>("hourlyRow");
    row.innerHTML = "";
    const hours = getUpcomingHours(days);
    if (hours.length === 0) return;

    const temps = hours.map((h) => Math.round(h.temp_c));
    const svgWidth = HOUR_ITEM_WIDTH * hours.length;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "hourly-sparkline");
    svg.setAttribute("viewBox", `0 0 ${svgWidth} 44`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("width", String(svgWidth));
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", buildSparklinePath(temps, svgWidth, 44));
    svg.appendChild(path);
    row.appendChild(svg);

    row.appendChild(buildHourLine(hours, (h) => `<span class="hour-label">${h.time.split(" ")[1] ?? h.time}</span>`));

    const tempsRow = buildHourLine(hours, (h) => `<span class="hour-temp">${Math.round(h.temp_c)}°</span>`);
    tempsRow.style.marginTop = "4px";
    row.appendChild(tempsRow);
}

function renderForecast(days: ForecastDay[]): void {
    const list = qs<HTMLDivElement>("forecastList");
    list.innerHTML = "";
    days.forEach((day, i) => {
        const icon = conditionIconHtml(day.day.condition.code, true);
        const rowEl = document.createElement("div");
        rowEl.className = "forecast-row";
        rowEl.innerHTML = `
            <span class="day">${formatDayLabel(day.date, i)}</span>
            <span class="cond-icon">${icon}</span>
            <span class="rain-chance">${day.day.daily_chance_of_rain}%</span>
            <span class="hi">${Math.round(day.day.maxtemp_c)}°</span>
            <span class="lo">${Math.round(day.day.mintemp_c)}°</span>
        `;
        list.appendChild(rowEl);
    });
}

const FAVORITES_KEY = "atmos-weather:favorites";

function loadFavorites(): string[] {
    try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
    } catch {
        return [];
    }
}

function saveFavorites(favorites: string[]): void {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function renderFavorites(): void {
    const list = qs<HTMLDivElement>("favoritesList");
    const favorites = loadFavorites();
    list.innerHTML = "";

    if (favorites.length === 0) {
        list.innerHTML = `<div class="favorites-empty">No favorites yet. Save a city to find it here.</div>`;
        return;
    }

    favorites.forEach((city) => {
        const row = document.createElement("div");
        row.className = "favorite-row";
        const safeCity = escapeHtml(city);
        row.innerHTML = `<span>${safeCity}</span><button class="remove-btn" aria-label="Remove ${safeCity}">✕</button>`;

        row.addEventListener("click", () => {
            location = city;
            qs<HTMLElement>("sideMenu").classList.remove("open");
            qs<HTMLDivElement>("sideMenuBackdrop").classList.remove("open");
            getData();
        });

        row.querySelector(".remove-btn")!.addEventListener("click", (e) => {
            e.stopPropagation();
            saveFavorites(loadFavorites().filter((c) => c !== city));
            renderFavorites();
        });

        list.appendChild(row);
    });
}

function addCurrentToFavorites(): void {
    if (!lastData) return;
    const city = lastData.location.name;
    const favorites = loadFavorites();
    if (favorites.some((c) => c.toLowerCase() === city.toLowerCase())) return;
    saveFavorites([...favorites, city]);
    renderFavorites();
}
export function currentCity(data:WeatherResponse):String{
    let state = data.location.name;
    let country = data.location.country;
    return state + " " + country;
}
function is_pm(time: string): boolean{
    let tmp = time.slice(-2);
    return (tmp.toUpperCase()) === "PM";
}
function is_am(time: string): boolean{
    let tmp = time.slice(-2);
    return (tmp.toUpperCase()) === "AM";
}

function change_pm_am_to_utc(time: string): string{
    let hoursStr = time.slice(0,2);
    let minStr = time.slice(3,5);
    let hours = parseInt(hoursStr, 10);

    let res: string = "";
    if (is_am(time)){
        if (hoursStr.toUpperCase() == "12"){
        hours = 0;
    }
    }
    else if (is_pm(time)){
        if (hoursStr.toUpperCase() != "12"){
            hours += 12;
        }
    }
    const formattedHours = hours.toString().padStart(2, "0");
    return `${formattedHours}:${minStr}`;
}

function render(data: WeatherResponse): void {
    lastData = data;
    const isDay = data.current.is_day === 1;
    const code = data.current.condition.code;
    

    qs<HTMLSpanElement>("locationText").textContent = `${data.location.name}, ${data.location.country}`.toUpperCase();

    currentTzId = data.location.tz_id;
    qs<HTMLDivElement>("tzId").textContent = data.location.tz_id;
    const offsetPart = new Intl.DateTimeFormat("en", {
        timeZone: data.location.tz_id, timeZoneName: "shortOffset",
    }).formatToParts(new Date()).find((p) => p.type === "timeZoneName");
    qs<HTMLDivElement>("tzOffset").textContent = offsetPart?.value ?? "";
    updateClock();

    qs<HTMLSpanElement>("temp").textContent = String(Math.round(data.current.temp_c));
    qs<HTMLDivElement>("conditionIcon").innerHTML = conditionIconHtml(code, isDay);
    qs<HTMLDivElement>("conditionText").textContent = data.current.condition.text;

    const today = data.forecast.forecastday[0]!;
    qs<HTMLDivElement>("feelsLike").textContent =
        `Feels like ${Math.round(data.current.feelslike_c)}° · H: ${Math.round(today.day.maxtemp_c)}° L: ${Math.round(today.day.mintemp_c)}°`;
    qs<HTMLSpanElement>("rainBadge").innerHTML = `${cloudRainIcon()}<span>${today.day.daily_chance_of_rain}% rain today</span>`;

    const aqiBadge = qs<HTMLSpanElement>("aqiBadge");
    const usEpaIndex = data.current.air_quality?.["us-epa-index"];
    if (usEpaIndex) {
        const { text, cls } = aqiLabel(usEpaIndex);
        aqiBadge.textContent = text;
        aqiBadge.className = `badge ${cls}`;
    } else {
        aqiBadge.className = "badge hidden";
    }

    qs<HTMLSpanElement>("humidityIcon").innerHTML = `${dropletIcon()}<span>Humidity</span>`;
    qs<HTMLDivElement>("humidityValue").textContent = `${data.current.humidity}% · ${humiditySub(data.current.humidity)}`;
    qs<HTMLSpanElement>("rainChanceIcon").innerHTML = `${cloudRainIcon()}<span>Chance of rain</span>`;
    qs<HTMLDivElement>("rainChanceValue").textContent = `${today.day.daily_chance_of_rain}%`;
    qs<HTMLSpanElement>("windIcon").innerHTML = `${windIcon()}<span>Wind</span>`;
    qs<HTMLDivElement>("windValue").textContent = `${Math.round(data.current.wind_kph)} km/h · ${data.current.wind_dir}`;
    qs<HTMLSpanElement>("uvIcon").innerHTML = `${sunIcon()}<span>UV Index</span>`;
    qs<HTMLDivElement>("uvValue").textContent = `${data.current.uv} · ${uvSub(data.current.uv)}`;
    qs<HTMLSpanElement>("visIcon").innerHTML = `${eyeIcon()}<span>Visibility</span>`;
    qs<HTMLDivElement>("visValue").textContent = `${data.current.vis_km} km · ${visSub(data.current.vis_km)}`;

    renderHourly(data.forecast.forecastday);
    renderForecast(data.forecast.forecastday);

    const sunRise: string = change_pm_am_to_utc(today.astro.sunrise); 

    const sunSet: string = change_pm_am_to_utc(today.astro.sunset);


    qs<HTMLSpanElement>("sunriseIcon").innerHTML = sunriseIcon();
    qs<HTMLSpanElement>("sunrise").textContent = sunRise;
    qs<HTMLSpanElement>("sunsetIcon").innerHTML = sunsetIcon();
    qs<HTMLSpanElement>("sunset").textContent = sunSet;
    qs<HTMLSpanElement>("moonIconLabel").innerHTML = `${moonIcon()}<span>Moon</span>`;
    qs<HTMLSpanElement>("moonPhase").textContent = `${today.astro.moon_phase} · ${today.astro.moon_illumination}%`;

    const alertBanner = qs<HTMLElement>("alertBanner");
    if (data.alerts?.alert?.length) {
        alertBanner.innerHTML = `${warningIcon()}<span>${escapeHtml(data.alerts.alert[0]!.headline)}</span>`;
        alertBanner.classList.add("alert");
    } else {
        alertBanner.innerHTML = "";
        alertBanner.classList.remove("alert");
    }

    applyBackground(code, isDay);
    void applyBackgroundPhoto(code, isDay, data);
    qs<HTMLDivElement>("sideMenuCurrent").textContent = `Viewing: ${data.location.name}, ${data.location.country}`;
}

let getDataRequestId = 0;

async function getData(): Promise<void> {
    const requestId = ++getDataRequestId;
    try {
        const res = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
        if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
        const data: WeatherResponse = await res.json();
        if (requestId !== getDataRequestId) return;
        render(data);
    } catch (err) {
        if (requestId !== getDataRequestId) return;
        const alertBanner = qs<HTMLElement>("alertBanner");
        alertBanner.innerHTML = `${warningIcon()}<span>Unable to load weather data.</span>`;
        alertBanner.classList.add("alert");
        console.error(err);
    }
}

function setupInteractions(): void {
    const menuBtn = qs<HTMLButtonElement>("menuBtn");
    const favoriteBtn = qs<HTMLButtonElement>("favoriteBtn");
    const searchPanel = qs<HTMLDivElement>("searchPanel");
    const citySearch = qs<HTMLInputElement>("citySearch");
    const citySearchBtn = qs<HTMLButtonElement>("citySearchBtn");
    const suggestionsEl = qs<HTMLDivElement>("searchSuggestions");
    const sideMenu = qs<HTMLElement>("sideMenu");
    const sideMenuBackdrop = qs<HTMLDivElement>("sideMenuBackdrop");

    let suggestions: CitySuggestion[] = [];
    let activeSuggestionIndex = -1;
    let debounceTimer: number | undefined;

    const closeSuggestions = () => {
        suggestionsEl.classList.add("hidden");
        suggestionsEl.innerHTML = "";
        suggestions = [];
        activeSuggestionIndex = -1;
    };

    const renderSuggestions = () => {
        if (suggestions.length === 0) {
            closeSuggestions();
            return;
        }
        suggestionsEl.innerHTML = suggestions.map((c, i) => `
            <button type="button" class="suggestion-row${i === activeSuggestionIndex ? " active" : ""}" data-index="${i}">
                ${escapeHtml(c.name)}<span class="region"> · ${escapeHtml([c.region, c.country].filter(Boolean).join(", "))}</span>
            </button>
        `).join("");
        suggestionsEl.classList.remove("hidden");
        suggestionsEl.querySelectorAll<HTMLButtonElement>(".suggestion-row").forEach((btn) => {
            btn.addEventListener("click", () => {
                const suggestion = suggestions[Number(btn.dataset["index"])];
                if (suggestion) selectSuggestion(suggestion);
            });
        });
    };

    const selectSuggestion = (city: CitySuggestion) => {
        location = city.name;
        closeSuggestions();
        searchPanel.classList.add("hidden");
        citySearch.value = "";
        getData();
    };

    const toggleSearch = () => {
        searchPanel.classList.toggle("hidden");
        if (searchPanel.classList.contains("hidden")) closeSuggestions();
        else citySearch.focus();
    };

    qs<HTMLButtonElement>("locationBtn").addEventListener("click", toggleSearch);

    const closeSideMenu = () => {
        sideMenu.classList.remove("open");
        sideMenuBackdrop.classList.remove("open");
    };
    const openSideMenu = () => {
        sideMenu.classList.add("open");
        sideMenuBackdrop.classList.add("open");
    };

    menuBtn.addEventListener("click", openSideMenu);
    favoriteBtn.addEventListener("click", openSideMenu);
    qs<HTMLButtonElement>("sideMenuCloseBtn").addEventListener("click", closeSideMenu);
    sideMenuBackdrop.addEventListener("click", closeSideMenu);
    qs<HTMLButtonElement>("saveFavoriteBtn").addEventListener("click", addCurrentToFavorites);
    renderFavorites();

    const submitSearch = () => {
        const value = citySearch.value.trim();
        if (!value) return;
        location = value;
        closeSuggestions();
        searchPanel.classList.add("hidden");
        citySearch.value = "";
        getData();
    };

    citySearchBtn.addEventListener("click", submitSearch);

    citySearch.addEventListener("input", () => {
        const query = citySearch.value.trim();
        window.clearTimeout(debounceTimer);
        if (query.length < 2) {
            closeSuggestions();
            return;
        }
        debounceTimer = window.setTimeout(async () => {
            try {
                const res = await fetch(`/api/search-cities?q=${encodeURIComponent(query)}`);
                suggestions = res.ok ? await res.json() : [];
            } catch {
                suggestions = [];
            }
            activeSuggestionIndex = -1;
            renderSuggestions();
        }, 250);
    });

    citySearch.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" && suggestions.length > 0) {
            e.preventDefault();
            activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestions.length;
            renderSuggestions();
        } else if (e.key === "ArrowUp" && suggestions.length > 0) {
            e.preventDefault();
            activeSuggestionIndex = (activeSuggestionIndex - 1 + suggestions.length) % suggestions.length;
            renderSuggestions();
        } else if (e.key === "Enter") {
            e.preventDefault();
            const active = suggestions[activeSuggestionIndex];
            if (active) selectSuggestion(active);
            else submitSearch();
        } else if (e.key === "Escape") {
            closeSuggestions();
        }
    });

    document.addEventListener("click", (e) => {
        if (!suggestionsEl.contains(e.target as Node) && e.target !== citySearch) closeSuggestions();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setupInteractions();
    getData();
    updateClock();
    setInterval(updateClock, 1000);
});


