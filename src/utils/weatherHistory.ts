// src/utils/weatherHistory.ts
// Fetches historical weather data using Open-Meteo (no API key required).
// Docs: https://open-meteo.com/en/docs

export type HistoricalWeather = {
  date: string;
  label: string;
  tmin: number;
  tmax: number;
  raw: any;
};

export async function fetchHistoricalWeather(
  lat: number,
  lon: number,
  dateISO: string
): Promise<HistoricalWeather | null> {
  if (!lat || !lon || !dateISO) {
    console.warn('Invalid parameters for fetchHistoricalWeather');
    return null;
  }

  const start = dateISO;
  const end = dateISO;

  const url = `https://archive-api.open-meteo.com/v1/era5?latitude=${lat}&longitude=${lon}&start_date=${start}&end_date=${end}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('Weather fetch failed:', response.status, response.statusText);
      return null;
    }

    const json = await response.json();

    if (!json?.daily || !Array.isArray(json.daily.time) || json.daily.time.length === 0) {
      console.warn('No daily weather data returned');
      return null;
    }

    const idx = 0;
    const { weathercode, temperature_2m_max, temperature_2m_min } = json.daily;

    const wcode: number = weathercode?.[idx] ?? 0;
    const tmax: number = temperature_2m_max?.[idx] ?? 0;
    const tmin: number = temperature_2m_min?.[idx] ?? 0;

    const codeMap: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Light rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Light snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      80: 'Light rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
    };

    const label = codeMap[wcode] ?? 'Unknown';

    return {
      date: start,
      label,
      tmin,
      tmax,
      raw: json.daily,
    };
  } catch (error) {
    console.error('Error fetching historical weather:', error);
    return null;
  }
}
