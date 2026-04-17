import type { SQLiteDatabase } from "expo-sqlite";
import * as settingsRepository from "@/data/settingsRepository";
import type { Units } from "@/providers/SettingsProvider";
import type { WeatherData } from "./types";

const CACHE_KEY = "weather.payload";

export const FRESH_MS = 60 * 60 * 1000;
export const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function roundCoord(c: number): number {
  return Math.round(c * 100) / 100;
}

export async function loadCached(db: SQLiteDatabase): Promise<WeatherData | null> {
  const raw = await settingsRepository.get(db, CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as WeatherData;
    if (Date.now() - parsed.fetchedAt > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveCached(db: SQLiteDatabase, data: WeatherData): Promise<void> {
  await settingsRepository.set(db, CACHE_KEY, JSON.stringify(data));
}

export async function clearCached(db: SQLiteDatabase): Promise<void> {
  await settingsRepository.set(db, CACHE_KEY, "");
}

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
  };
  daily?: {
    sunrise?: string[];
    sunset?: string[];
  };
};

export async function fetchCurrent(lat: number, lon: number, units: Units): Promise<WeatherData> {
  const tempUnit = units === "imperial" ? "fahrenheit" : "celsius";
  const windUnit = units === "imperial" ? "mph" : "kmh";
  const rLat = roundCoord(lat);
  const rLon = roundCoord(lon);

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${rLat}&longitude=${rLon}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m` +
    `&daily=sunrise,sunset&timezone=auto` +
    `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`weather fetch failed: ${res.status}`);
  const json = (await res.json()) as OpenMeteoResponse;

  return {
    fetchedAt: Date.now(),
    location: { lat: rLat, lon: rLon },
    units,
    current: {
      temperature: json.current?.temperature_2m ?? 0,
      weatherCode: json.current?.weather_code ?? 0,
      windSpeed: json.current?.wind_speed_10m ?? 0,
      windDirection: json.current?.wind_direction_10m ?? 0,
    },
    daily: {
      sunrise: json.daily?.sunrise?.[0] ?? "",
      sunset: json.daily?.sunset?.[0] ?? "",
    },
  };
}
