import React from 'react';

interface SimonDicompelLogoProps {
  className?: string;
  height?: number | string;
  variant?: 'color' | 'white';
}

export const SimonDicompelLogo: React.FC<SimonDicompelLogoProps> = ({
  className = '',
  height = 36,
  variant = 'color',
}) => {
  const [hasError, setHasError] = React.useState(false);
  const src = variant === 'white' ? '/simon_dicompel_logo_white.png' : '/simon_dicompel_logo_clean.png';
  const numericHeight = typeof height === 'number' ? height : parseInt(String(height), 10) || 36;

  if (hasError) {
    // High-fidelity SVG matching the official Simon Dicompel brand with #003355
    const brandColor = variant === 'white' ? '#ffffff' : '#003355';
    return (
      <svg
        viewBox="0 0 540 125"
        height={height}
        className={`inline-block select-none ${className}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          x="10"
          y="84"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="78"
          fill={brandColor}
          letterSpacing="-3"
        >
          simon
        </text>
        <circle cx="260" cy="62" r="11" fill={brandColor} />
        <path
          d="M 405 24 A 54 54 0 1 1 405 106"
          fill="none"
          stroke={brandColor}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <text
          x="288"
          y="68"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="48"
          fill={brandColor}
          letterSpacing="-1.5"
        >
          dicompel
        </text>
        <text
          x="315"
          y="95"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="600"
          fontSize="22"
          fill={brandColor}
          letterSpacing="-0.5"
        >
          Part of Simon
        </text>
      </svg>
    );
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src={src}
        alt="Simon Dicompel - Part of Simon"
        onError={() => setHasError(true)}
        style={{ height: `${numericHeight}px`, width: 'auto' }}
        className="object-contain block max-w-none"
      />
    </div>
  );
};
