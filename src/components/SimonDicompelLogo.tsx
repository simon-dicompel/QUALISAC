import React from 'react';

interface SimonDicompelLogoProps {
  className?: string;
  height?: number;
}

export const SimonDicompelLogo: React.FC<SimonDicompelLogoProps> = ({ className = '', height = 32 }) => {
  return (
    <svg 
      viewBox="0 0 540 120" 
      height={height} 
      className={`inline-block select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* "simon" text - lowercase, rounded, extra bold, blue */}
      <text 
        x="10" 
        y="85" 
        fontFamily="system-ui, -apple-system, sans-serif" 
        fontWeight="800" 
        fontSize="76" 
        fill="#0066b2" 
        letterSpacing="-3"
      >
        simon
      </text>

      {/* Vertical divider line */}
      <line 
        x1="245" 
        y1="20" 
        x2="245" 
        y2="100" 
        stroke="#94a3b8" 
        strokeWidth="2.5" 
      />

      {/* "dicompel" and broken circle */}
      {/* Circle center around (445, 60), radius 48 */}
      {/* Thick circle border, missing an arc on the left */}
      <path 
        d="M 405 28 A 48 48 0 1 1 405 92" 
        fill="none" 
        stroke="#1a1a1a" 
        strokeWidth="9" 
        strokeLinecap="round" 
      />

      {/* "dicompel" text */}
      {/* "di" is written on the left of the circle's opening/inside, "compel" is inside the circle */}
      {/* "dicompel" overall should span nicely across the circle */}
      <text 
        x="270" 
        y="83" 
        fontFamily="system-ui, -apple-system, sans-serif" 
        fontWeight="800" 
        fontSize="65" 
        fill="#1a1a1a" 
        letterSpacing="-2.5"
      >
        dicompel
      </text>
    </svg>
  );
};
