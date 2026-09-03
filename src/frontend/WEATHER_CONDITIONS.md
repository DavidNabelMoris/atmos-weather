# WeatherAPI condition codes

WeatherAPI.com defines 48 official condition codes. Each code has one fixed
`condition.text` string (used verbatim in the UI) and a day/night icon pair.
This app additionally buckets every code into one of 10 broader `category`
values (see [weatherCategories.ts](weatherCategories.ts)) used only to pick
an icon (`icons.ts`) and a background (`styles.css`) — never to change the
displayed text.

## clear

| Code | condition.text |
|---|---|
| 1000 | Sunny / Clear |

## partly-cloudy

| Code | condition.text |
|---|---|
| 1003 | Partly cloudy |

## cloudy

| Code | condition.text |
|---|---|
| 1006 | Cloudy |

## overcast

| Code | condition.text |
|---|---|
| 1009 | Overcast |

## fog

| Code | condition.text |
|---|---|
| 1030 | Mist |
| 1135 | Fog |
| 1147 | Freezing fog |

## drizzle

| Code | condition.text |
|---|---|
| 1072 | Patchy freezing drizzle possible |
| 1150 | Patchy light drizzle |
| 1153 | Light drizzle |
| 1168 | Freezing drizzle |
| 1171 | Heavy freezing drizzle |

## rain

| Code | condition.text |
|---|---|
| 1063 | Patchy rain possible |
| 1180 | Patchy light rain |
| 1183 | Light rain |
| 1186 | Moderate rain at times |
| 1189 | Moderate rain |
| 1192 | Heavy rain at times |
| 1195 | Heavy rain |
| 1198 | Light freezing rain |
| 1201 | Moderate or heavy freezing rain |
| 1240 | Light rain shower |
| 1243 | Moderate or heavy rain shower |
| 1246 | Torrential rain shower |

## sleet

| Code | condition.text |
|---|---|
| 1069 | Patchy sleet possible |
| 1204 | Light sleet |
| 1207 | Moderate or heavy sleet |
| 1237 | Ice pellets |
| 1249 | Light sleet showers |
| 1252 | Moderate or heavy sleet showers |
| 1261 | Light showers of ice pellets |
| 1264 | Moderate or heavy showers of ice pellets |

## snow

| Code | condition.text |
|---|---|
| 1066 | Patchy snow possible |
| 1114 | Blowing snow |
| 1117 | Blizzard |
| 1210 | Patchy light snow |
| 1213 | Light snow |
| 1216 | Patchy moderate snow |
| 1219 | Moderate snow |
| 1222 | Patchy heavy snow |
| 1225 | Heavy snow |
| 1255 | Light snow showers |
| 1258 | Moderate or heavy snow showers |

## thunderstorm

| Code | condition.text |
|---|---|
| 1087 | Thundery outbreaks possible |
| 1273 | Patchy light rain with thunder |
| 1276 | Moderate or heavy rain with thunder |
| 1279 | Patchy light snow with thunder |
| 1282 | Moderate or heavy snow with thunder |

---

48 codes total, all mapped in `CODE_TO_CATEGORY` in
[weatherCategories.ts](weatherCategories.ts) — none fall through to the
`?? "cloudy"` fallback in `categorize()`.
