// src/utils/weatherHistory.ts
// Fetches historical weather data using AccuWeather API (requires API key).

export type HistoricalWeather = {
  date: string;
  label: string;
  tmin: number;
  tmax: number;
  raw: any;
};

const ACCUWEATHER_API_KEY = import.meta.env.VITE_ACCUWEATHER_API_KEY;

/**
 * Fetches location key from AccuWeather for a given latitude/longitude.
 */
async function fetchLocationKey(lat: number, lon: number): Promise<string | null> {
  try {
    const geoUrl = `https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${ACCUWEATHER_API_KEY}&q=${lat},${lon}`;
    const res = await fetch(geoUrl);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.Key ?? null;
  } catch (err) {
    console.error("❌ Error fetching location key:", err);
    return null;
  }
}

/**
 * Fetch historical weather for a given latitude, longitude, and ISO date.
 */
export async function fetchHistoricalWeather(
  lat: number,
  lon: number,
  dateISO: string
): Promise<HistoricalWeather | null> {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon) || !dateISO) {
    console.warn("⚠️ Invalid parameters for fetchHistoricalWeather:", { lat, lon, dateISO });
    return null;
  }

  const date = dateISO.split("T")[0]; // yyyy-mm-dd

  try {
    const locationKey = await fetchLocationKey(lat, lon);
    if (!locationKey) {
      console.warn("⚠️ Could not find location key for coordinates:", { lat, lon });
      return null;
    }

    // AccuWeather historical endpoint (daily)
    const histUrl = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}/historical/24?apikey=${ACCUWEATHER_API_KEY}&details=true`;
    const res = await fetch(histUrl);
    if (!res.ok) {
      console.warn("⚠️ Weather fetch failed:", res.status, res.statusText);
      return null;
    }

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) {
      console.warn("⚠️ No weather data returned for date:", date);
      return null;
    }

    // Pick the first matching day (AccuWeather historical returns array of past days)
    const dayData = json[0];

    const tmin = dayData.Temperature?.Minimum?.Metric?.Value ?? 0;
    const tmax = dayData.Temperature?.Maximum?.Metric?.Value ?? 0;
    const label = dayData.WeatherText ?? "Unknown weather";

    console.log(`✅ Weather data for ${date}: ${label}, ${tmin}°C–${tmax}°C`);

    return {
      date,
      label,
      tmin,
      tmax,
      raw: dayData,
    };
  } catch (err) {
    console.error("❌ Error fetching historical weather:", err);
    return null;
  }
}
