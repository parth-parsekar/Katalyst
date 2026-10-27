import React from 'react';

export const Logo = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Soft pastel blue circular background */}
      <circle cx="50" cy="48" r="34" fill="#DBEAFE" />

      {/* Stairs body (filled with light slate/gray and outlined in bold dark) */}
      <path
        d="M 22 72 H 32 V 60 H 45 V 48 H 58 V 38 H 76 V 72 H 22 Z"
        fill="#CBD5E1"
        stroke="#0F172A"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Baseline ground extension */}
      <line
        x1="18"
        y1="72"
        x2="78"
        y2="72"
        stroke="#0F172A"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Flagpole on top platform */}
      <line
        x1="65"
        y1="38"
        x2="65"
        y2="16"
        stroke="#0F172A"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Flag pointing left with swallowtail cut */}
      <path
        d="M 65 18 L 46 18 L 51 25.5 L 46 33 L 65 33 Z"
        fill="#3B82F6"
        stroke="#0F172A"
        strokeWidth="3.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default Logo;
