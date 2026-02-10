import { useEffect, useState } from 'react';

interface WaterProgressProps {
  percentage: number;
  size?: number;
  animationKey?: number;
}

export const WaterProgress = ({ percentage, size = 220, animationKey = 0 }: WaterProgressProps) => {
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const clampedPercentage = Math.min(percentage, 100);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDisplayPercentage(clampedPercentage);
    }, 100);
    return () => clearTimeout(timeout);
  }, [clampedPercentage]);

  const fillHeight = (displayPercentage / 100) * 70; // max 70% of viewbox height for aesthetics

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-2xl"
        role="img"
        aria-label={`Water intake progress: ${Math.round(percentage)}%`}
      >
        <defs>
          <clipPath id="bottleClip">
            <circle cx="100" cy="100" r="85" />
          </clipPath>
          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0c1929" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r="85"
          fill="url(#bgGrad)"
          stroke="#1e3a5f"
          strokeWidth="2"
        />

        {/* Water fill */}
        <g clipPath="url(#bottleClip)">
          <rect
            x="0"
            y={200 - fillHeight * 2}
            width="200"
            height={fillHeight * 2 + 10}
            fill="url(#waterGrad)"
            className="transition-all duration-1000 ease-out"
          />
          {/* Wave effect */}
          {displayPercentage > 0 && (
            <path
              d={`M0,${200 - fillHeight * 2}
                  Q25,${200 - fillHeight * 2 - 6} 50,${200 - fillHeight * 2}
                  T100,${200 - fillHeight * 2}
                  T150,${200 - fillHeight * 2}
                  T200,${200 - fillHeight * 2}
                  T250,${200 - fillHeight * 2}
                  T300,${200 - fillHeight * 2}
                  T350,${200 - fillHeight * 2}
                  T400,${200 - fillHeight * 2}
                  V200 H0 Z`}
              fill="#38bdf8"
              opacity="0.3"
              className="animate-wave"
            />
          )}
        </g>

        {/* Outer ring */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="3"
          strokeDasharray={`${(clampedPercentage / 100) * 565} 565`}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          className="transition-all duration-1000 ease-out"
          opacity="0.6"
        />
      </svg>

      {/* Center text */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        key={animationKey}
      >
        <span className="text-4xl font-bold text-white tabular-nums">
          {Math.round(percentage)}%
        </span>
        <span className="text-sm text-hydro-text-muted mt-1">completed</span>
      </div>
    </div>
  );
};
