import type { Units } from "@/providers/SettingsProvider";

export type WeatherData = {
  fetchedAt: number;
  location: { lat: number; lon: number };
  units: Units;
  current: {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
    windDirection: number;
  };
  daily: {
    sunrise: string;
    sunset: string;
  };
};
