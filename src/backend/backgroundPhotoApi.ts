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
// console.log(isKnownBackgroundCategory("Rain_Night"));

interface PixabayHit {
    webformatURL: string;
    largeImageURL: string;
}

interface PixabayResponse {
    hits: PixabayHit[];
}

export async function fetchBackgroundPhotoUrl(apiKey: string, category: string): Promise<string | null> {
    const query = WEATHER_QUERIES[category];
    let result: string | null;

    if (query) {
        const txt = encodeURIComponent(query);
        const url = `${PIXABAY_API_BASE}/?key=${apiKey}&q=${txt}&image_type=photo&orientation=horizontal&safesearch=true&per_page=3`;
        const res = await fetch(url);

        if (res.ok) {
            const data = (await res.json()) as PixabayResponse;

            if (data.hits && data.hits.length > 0 &&  data.hits[0]) {
                result = data.hits[0].largeImageURL;
            } else {
                result = null;
            }
        } else {
           result = null;
        }
    } else {
        result = null;
    }
    return result ;
}