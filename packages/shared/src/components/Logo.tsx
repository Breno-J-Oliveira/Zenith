import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 525 525"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color: 'var(--color-primary)' }}
    >
      <g clipPath="url(#logo-clip)">
        <g transform="matrix(1, 0, 0, 1, 0, 0)">
          <g clipPath="url(#logo-clip-inner)">
            <g fill="currentColor" fillOpacity="1"><g transform="translate(501.906853, 333.758715)"><g><path d="M -236.78125 94.203125 L -258.0625 67 L -7.765625 -128.9375 L 13.515625 -101.734375 Z M -236.78125 94.203125 " /></g></g></g>
            <g fill="currentColor" fillOpacity="1"><g transform="translate(361.020881, 162.371635)"><g><path d="M -83.21875 240.875 L -117.71875 239.25 L -102.75 -78.28125 L -68.25 -76.65625 Z M -83.21875 240.875 " /></g></g></g>
            <g fill="currentColor" fillOpacity="1"><g transform="translate(266.866449, 214.256581)"><g><path d="M -236.78125 94.203125 L -258.0625 67 L -7.765625 -128.9375 L 13.515625 -101.734375 Z M -236.78125 94.203125 " /></g></g></g>
            <g fill="currentColor" fillOpacity="1"><g transform="translate(444.036018, 298.229773)"><g><path d="M -180.15625 71.671875 L -196.375 50.96875 L -5.921875 -98.109375 L 10.296875 -77.40625 Z M -180.15625 71.671875 " /></g></g></g>
            <g fill="currentColor" fillOpacity="1"><g transform="translate(262.016938, 239.979088)"><g><path d="M -180.15625 71.671875 L -196.375 50.96875 L -5.921875 -98.109375 L 10.296875 -77.40625 Z M -180.15625 71.671875 " /></g></g></g>
            <g fill="currentColor" fillOpacity="1"><g transform="translate(257.993993, 256.849941)"><g><path d="M -128.6875 51.1875 L -140.25 36.40625 L -4.21875 -70.0625 L 7.34375 -55.28125 Z M -128.6875 51.1875 " /></g></g></g>
            <g fill="currentColor" fillOpacity="1"><g transform="translate(397.010714, 272.676571)"><g><path d="M -128.6875 51.1875 L -140.25 36.40625 L -4.21875 -70.0625 L 7.34375 -55.28125 Z M -128.6875 51.1875 " /></g></g></g>
          </g>
        </g>
      </g>
      <defs>
        <clipPath id="logo-clip"><path d="M 0.5 0 L 524.5 0 L 524.5 524 L 0.5 524 Z M 0.5 0 " clipRule="nonzero" /></clipPath>
        <clipPath id="logo-clip-inner"><rect x="0" width="525" y="0" height="524" /></clipPath>
      </defs>
    </svg>
  );
};
