export type Category =
    | "clear"
    | "partly-cloudy"
    | "cloudy"
    | "overcast"
    | "fog"
    | "drizzle"
    | "rain"
    | "sleet"
    | "snow"
    | "thunderstorm";

export interface CategorizedCondition {
    category: Category;
    daytime: "day" | "night";
}

const CODE_TO_CATEGORY: Record<number, Category> = {
    1000: "clear",
    1003: "partly-cloudy",
    1006: "cloudy",
    1009: "overcast",

    1030: "fog",
    1135: "fog",
    1147: "fog",

    1072: "drizzle",
    1150: "drizzle",
    1153: "drizzle",
    1168: "drizzle",
    1171: "drizzle",

    1063: "rain",
    1180: "rain",
    1183: "rain",
    1186: "rain",
    1189: "rain",
    1192: "rain",
    1195: "rain",
    1198: "rain",
    1201: "rain",
    1240: "rain",
    1243: "rain",
    1246: "rain",

    1069: "sleet",
    1204: "sleet",
    1207: "sleet",
    1237: "sleet",
    1249: "sleet",
    1252: "sleet",
    1261: "sleet",
    1264: "sleet",

    1066: "snow",
    1114: "snow",
    1117: "snow",
    1210: "snow",
    1213: "snow",
    1216: "snow",
    1219: "snow",
    1222: "snow",
    1225: "snow",
    1255: "snow",
    1258: "snow",

    1087: "thunderstorm",
    1273: "thunderstorm",
    1276: "thunderstorm",
    1279: "thunderstorm",
    1282: "thunderstorm",
};

export const ALL_CATEGORIES: Category[] = [
    "clear",
    "partly-cloudy",
    "cloudy",
    "overcast",
    "fog",
    "drizzle",
    "rain",
    "sleet",
    "snow",
    "thunderstorm",
];

export function categorize(conditionCode: number, isDay: boolean): CategorizedCondition {
    return {
        category: CODE_TO_CATEGORY[conditionCode] ?? "cloudy",
        daytime: isDay ? "day" : "night",
    };
}
