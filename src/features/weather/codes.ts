const ICONS: Record<number, string> = {
  0: "weather-sunny",
  1: "weather-partly-cloudy",
  2: "weather-partly-cloudy",
  3: "weather-cloudy",
  45: "weather-fog",
  48: "weather-fog",
  51: "weather-rainy",
  53: "weather-rainy",
  55: "weather-rainy",
  56: "weather-snowy-rainy",
  57: "weather-snowy-rainy",
  61: "weather-pouring",
  63: "weather-pouring",
  65: "weather-pouring",
  66: "weather-snowy-rainy",
  67: "weather-snowy-rainy",
  71: "weather-snowy",
  73: "weather-snowy",
  75: "weather-snowy",
  77: "weather-snowy",
  80: "weather-pouring",
  81: "weather-pouring",
  82: "weather-pouring",
  85: "weather-snowy-heavy",
  86: "weather-snowy-heavy",
  95: "weather-lightning",
  96: "weather-lightning-rainy",
  99: "weather-lightning-rainy",
};

export function iconForCode(code: number): string {
  return ICONS[code] ?? "weather-cloudy";
}

export function i18nKeyForCode(code: number): string {
  if (code === 0) return "home.weather.codes.clear";
  if (code >= 1 && code <= 2) return "home.weather.codes.partlyCloudy";
  if (code === 3) return "home.weather.codes.overcast";
  if (code === 45 || code === 48) return "home.weather.codes.fog";
  if (code >= 51 && code <= 57) return "home.weather.codes.drizzle";
  if (code >= 61 && code <= 67) return "home.weather.codes.rain";
  if (code >= 71 && code <= 77) return "home.weather.codes.snow";
  if (code >= 80 && code <= 82) return "home.weather.codes.rainShowers";
  if (code >= 85 && code <= 86) return "home.weather.codes.snowShowers";
  if (code === 95) return "home.weather.codes.thunderstorm";
  if (code >= 96 && code <= 99) return "home.weather.codes.thunderstormHail";
  return "home.weather.codes.unknown";
}
