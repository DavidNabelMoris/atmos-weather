const PIXABAY_API_BASE = "https://pixabay.com/api";

const WEATHER_QUERIES: Record<string, string> = {
    Sunny: "bright sunny day blue sky sunbeams landscape",
    Clear: "clear night sky stars moon dark landscape",

    Partly_CloudyDay: "partly cloudy day blue sky sun clouds landscape",
    Partly_CloudyNight: "partly cloudy night sky moon behind clouds stars landscape",

    Cloudy_Day: "cloudy sky overcast cumulus nature landscape",
    Cloudy_Night: "cloudy night sky moody dark moonlight landscape",

    Overcast_Day: "overcast sky gray clouds landscape",
    Overcast_Night: "dark overcast night sky moody dark landscape",

    Fog_Day: "dense fog mist misty moody morning landscape forest",
    Fog_Night: "misty fog night dark moody landscape outdoor",

    Drizzle_Day: "light rain drizzle misty outdoor nature landscape",
    Drizzle_Night: "light drizzle night streetlights dark moody outdoor",

    Rain_Day: "rainy day heavy rain wet nature storm clouds landscape",
    Rain_Night: "rainy night dark wet landscape city lights reflection",

    Sleet_Day: "sleet icy rain cold winter storm landscape",
    Sleet_Night: "icy sleet night cold dark winter landscape",

    Snow_Day: "snowy winter landscape frozen mountain scenic white",
    Snow_Night: "snowy night sky winter landscape quiet dark scenic",

    Thunderstorm_Day: "dark storm clouds lightning sky thunderstorm day dramatic",
    Thunderstorm_Night: "dark night storm lightning flash thunderstorm dramatic sky",
};

export function isKnownBackgroundCategory(category: string): boolean {
    return category in WEATHER_QUERIES;
}

interface PixabayHit {
    webformatURL: string;
    largeImageURL: string;
    imageWidth: number;
    imageHeight: number;
}

interface PixabayResponse {
    hits: PixabayHit[];
}

// Pixabay has no aspect-ratio filter, so we pull a wide pool of candidates
// (both orientations) and pick whichever hit's actual photo dimensions are
// closest to the caller's viewport ratio. That minimizes how much
// background-size:cover has to crop, without ever leaving uncovered gaps.
export async function fetchBackgroundPhotoUrl(
    apiKey: string,
    category: string,
    targetRatio: number,
): Promise<string | null> {
    const query = WEATHER_QUERIES[category];
    if (!query) return null;

    const txt = encodeURIComponent(query);
    const url = `${PIXABAY_API_BASE}/?key=${apiKey}&q=${txt}&image_type=photo&orientation=all&safesearch=true&per_page=40`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = (await res.json()) as PixabayResponse;
    if (!data.hits || data.hits.length === 0) return null;

    let best = data.hits[0]!;
    let bestDiff = Math.abs(best.imageWidth / best.imageHeight - targetRatio);
    for (const hit of data.hits) {
        const diff = Math.abs(hit.imageWidth / hit.imageHeight - targetRatio);
        if (diff < bestDiff) {
            best = hit;
            bestDiff = diff;
        }
    }
    return best.largeImageURL;
}