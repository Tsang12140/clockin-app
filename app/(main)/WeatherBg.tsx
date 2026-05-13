'use client';

import type { WeatherCategory } from '@/lib/weather';

const RAIN_DROPS = 14;
const SNOW_FLAKES = 10;

export default function WeatherBg({ category }: { category: WeatherCategory }) {
  if (category === 'sunny') {
    return (
      <div className="weather-bg weather-bg--sunny" aria-hidden>
        <div className="sun-core" />
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`sun-orb sun-orb--${i}`} />
        ))}
      </div>
    );
  }

  if (category === 'rainy') {
    return (
      <div className="weather-bg weather-bg--rainy" aria-hidden>
        {Array.from({ length: RAIN_DROPS }, (_, i) => (
          <div
            key={i}
            className="rain-drop"
            style={{
              left:             `${((i * 97) % 100) + 0.5}%`,
              animationDelay:   `${((i * 0.19) % 1.4).toFixed(2)}s`,
              animationDuration:`${(0.7 + (i % 5) * 0.09).toFixed(2)}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (category === 'thunderstorm') {
    return (
      <div className="weather-bg weather-bg--rainy" aria-hidden>
        <div className="lightning-bolt" />
        {Array.from({ length: RAIN_DROPS }, (_, i) => (
          <div
            key={i}
            className="rain-drop"
            style={{
              left:             `${((i * 97) % 100) + 0.5}%`,
              animationDelay:   `${((i * 0.19) % 1.4).toFixed(2)}s`,
              animationDuration:`${(0.7 + (i % 5) * 0.09).toFixed(2)}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (category === 'snowy') {
    return (
      <div className="weather-bg weather-bg--snowy" aria-hidden>
        {Array.from({ length: SNOW_FLAKES }, (_, i) => (
          <div
            key={i}
            className="snow-flake"
            style={{
              left:             `${((i * 113) % 96) + 2}%`,
              animationDelay:   `${((i * 0.31) % 2).toFixed(2)}s`,
              animationDuration:`${(1.8 + (i % 4) * 0.3).toFixed(2)}s`,
              fontSize:         `${10 + (i % 3) * 4}px`,
            }}
          >
            ❄
          </div>
        ))}
      </div>
    );
  }

  if (category === 'cloudy') {
    return (
      <div className="weather-bg weather-bg--cloudy" aria-hidden>
        <div className="cloud cloud--1" />
        <div className="cloud cloud--2" />
      </div>
    );
  }

  return (
    <div className="weather-bg weather-bg--foggy" aria-hidden>
      <div className="fog-line fog-line--1" />
      <div className="fog-line fog-line--2" />
      <div className="fog-line fog-line--3" />
    </div>
  );
}
