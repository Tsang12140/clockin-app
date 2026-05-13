export interface WeatherDay {
  fxDate:       string;
  textDay:      string;
  tempMax:      string;
  tempMin:      string;
  iconDay:      string;
  windDirDay:   string;
  windScaleDay: string;
}

export interface WeatherSnapshot {
  today:    WeatherDay;
  tomorrow: WeatherDay;
  days?:    WeatherDay[];
}

export type WeatherCategory = 'sunny' | 'rainy' | 'thunderstorm' | 'snowy' | 'cloudy' | 'foggy';

export function getWeatherCategory(iconCode: string): WeatherCategory {
  const c = parseInt(iconCode);
  if (c === 100 || c === 150) return 'sunny';
  if (c >= 302 && c <= 304)   return 'thunderstorm';
  if (c >= 300 && c <= 318)   return 'rainy';
  if (c >= 400 && c <= 410)   return 'snowy';
  if (c >= 500 && c <= 515)   return 'foggy';
  return 'cloudy';
}

export function getWeatherEmoji(iconCode: string): string {
  const c = parseInt(iconCode);
  if (c === 100 || c === 150) return '☀️';
  if (c === 101 || c === 151) return '⛅';
  if (c === 102 || c === 152) return '🌤️';
  if (c === 103 || c === 153) return '⛅';
  if (c === 104 || c === 154) return '☁️';
  if (c === 302 || c === 303) return '⛈️';
  if (c >= 300 && c <= 318)   return '🌧️';
  if (c >= 400 && c <= 410)   return '❄️';
  if (c >= 500 && c <= 515)   return '🌫️';
  return '🌡️';
}

// Module-level in-memory cache (lives until server restart)
let _locId: string | null = null;
let _cache: { data: WeatherSnapshot | null; ts: number } | null = null;
let _historyCache: Record<string, WeatherDay> = {};
const CACHE_MS = 30 * 60 * 1000;

const API_HOST = 'kk46h44wbk.re.qweatherapi.com';

async function resolveLocId(): Promise<string | null> {
  if (_locId) return _locId;
  const key = process.env.QWEATHER_KEY ?? '';
  if (!key) return null;

  // Prefer explicit location ID (skip GeoAPI)
  const locId = process.env.QWEATHER_LOCATION ?? '';
  if (locId) { _locId = locId; return _locId; }

  // Fallback: city name lookup via private host
  const city = process.env.QWEATHER_CITY ?? '广州';
  try {
    const r = await fetch(
      `https://${API_HOST}/v2/city/lookup?location=${encodeURIComponent(city)}&key=${key}`,
      { cache: 'force-cache' }
    );
    const d = await r.json();
    if (d.code === '200' && d.location?.[0]?.id) {
      _locId = d.location[0].id as string;
      return _locId;
    }
  } catch {}
  return null;
}

export function getWeatherDecision(snapshot: WeatherSnapshot | null) {
  if (!snapshot) return null;

  return getWeatherDecisionForDay(snapshot, snapshot.tomorrow);
}

export function findWeatherDay(snapshot: WeatherSnapshot | null, date: string): WeatherDay | null {
  if (!snapshot) return null;
  const fromDays = snapshot.days?.find(day => day.fxDate === date);
  if (fromDays) return fromDays;
  if (snapshot.today.fxDate === date) return snapshot.today;
  if (snapshot.tomorrow.fxDate === date) return snapshot.tomorrow;
  return null;
}

export function getWeatherDecisionForDay(snapshot: WeatherSnapshot | null, targetDay: WeatherDay | null) {
  if (!snapshot || !targetDay) return null;

  const todayCategory = getWeatherCategory(snapshot.today.iconDay);
  const targetCategory = getWeatherCategory(targetDay.iconDay);
  const todayAvg = (parseFloat(snapshot.today.tempMax) + parseFloat(snapshot.today.tempMin)) / 2;
  const targetAvg = (parseFloat(targetDay.tempMax) + parseFloat(targetDay.tempMin)) / 2;
  const tempDelta = Math.round(targetAvg - todayAvg);
  const hasBigTempChange = Math.abs(tempDelta) >= 5;
  const todayPrecip = todayCategory === 'rainy' || todayCategory === 'thunderstorm' || todayCategory === 'snowy';
  const targetPrecip = targetCategory === 'rainy' || targetCategory === 'thunderstorm' || targetCategory === 'snowy';

  const showAnimation =
    targetPrecip ||
    (todayPrecip && !targetPrecip) ||
    hasBigTempChange;

  const tempHint = hasBigTempChange
    ? tempDelta > 0
      ? `升温${tempDelta}°C，注意防晒补水`
      : `降温${Math.abs(tempDelta)}°C，注意添衣`
    : null;

  return {
    showAnimation,
    tempHint,
    category: targetCategory,
    todayCategory,
    tomorrowCategory: targetCategory,
    targetCategory,
    tempDelta,
  };
}

async function fetchDailyWeather(locId: string, key: string, days: 7 | 3): Promise<WeatherDay[] | null> {
  try {
    const r = await fetch(
      `https://${API_HOST}/v7/weather/${days}d?location=${locId}&key=${key}`,
      { next: { revalidate: 1800 } }
    );
    const d = await r.json();
    if (d.code !== '200' || !Array.isArray(d.daily)) return null;
    return d.daily as WeatherDay[];
  } catch {
    return null;
  }
}

interface HistoricalWeatherHourly {
  time:      string;
  icon:      string;
  text:      string;
  windDir?:  string;
  windScale?: string;
}

interface HistoricalWeatherDaily {
  date:    string;
  tempMax: string;
  tempMin: string;
}

function pickHistoricalRepresentative(hourly: HistoricalWeatherHourly[] | undefined): HistoricalWeatherHourly | null {
  if (!hourly?.length) return null;
  return hourly.find(item => item.time.endsWith('12:00'))
    ?? hourly.find(item => item.time.endsWith('15:00'))
    ?? hourly[Math.floor(hourly.length / 2)]
    ?? hourly[0]
    ?? null;
}

export async function fetchHistoricalWeatherDay(date: string): Promise<WeatherDay | null> {
  if (_historyCache[date]) return _historyCache[date];

  const key = process.env.QWEATHER_KEY ?? '';
  if (!key) return null;

  try {
    const locId = await resolveLocId();
    if (!locId) return null;

    const r = await fetch(
      `https://${API_HOST}/v7/historical/weather?location=${locId}&date=${date.replaceAll('-', '')}&key=${key}`,
      { next: { revalidate: 24 * 60 * 60 } }
    );
    const d = await r.json();
    if (d.code !== '200' || !d.weatherDaily) return null;

    const daily = d.weatherDaily as HistoricalWeatherDaily;
    const representative = pickHistoricalRepresentative(d.weatherHourly as HistoricalWeatherHourly[] | undefined);
    if (!representative) return null;

    const data: WeatherDay = {
      fxDate:       daily.date,
      textDay:      representative.text,
      tempMax:      daily.tempMax,
      tempMin:      daily.tempMin,
      iconDay:      representative.icon,
      windDirDay:   representative.windDir ?? '',
      windScaleDay: representative.windScale ?? '',
    };
    _historyCache = { ..._historyCache, [date]: data };
    return data;
  } catch {
    return null;
  }
}

export async function fetchWeatherSnapshot(): Promise<WeatherSnapshot | null> {
  const now = Date.now();
  if (_cache && now - _cache.ts < CACHE_MS) return _cache.data;

  const key = process.env.QWEATHER_KEY ?? '';
  if (!key) return null;

  try {
    const locId = await resolveLocId();
    if (!locId) return null;

    const daily = await fetchDailyWeather(locId, key, 7) ?? await fetchDailyWeather(locId, key, 3);
    if (!daily) return null;

    const today = daily[0] ?? null;
    const tomorrow = daily[1] ?? null;
    const data = today && tomorrow ? { today, tomorrow, days: daily.slice(0, 7) } : null;
    _cache = { data, ts: now };
    return data;
  } catch {
    _cache = { data: null, ts: now };
    return null;
  }
}

export async function fetchTomorrowWeather(): Promise<WeatherDay | null> {
  const snapshot = await fetchWeatherSnapshot();
  return snapshot?.tomorrow ?? null;
}
