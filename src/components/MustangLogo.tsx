export default function MustangLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle */}
      <circle cx="50" cy="44" r="36" stroke="#154734" strokeWidth="5" fill="none" />

      {/* Mustang head — simplified silhouette */}
      <path
        d="M38 22 C38 22 32 26 30 32 C28 38 30 44 34 48 C36 50 38 51 40 52 L40 58 C40 58 44 56 46 54 C50 56 54 55 57 52 C62 48 64 42 62 36 C60 30 55 24 50 22 C46 20 42 20 38 22Z"
        fill="#154734"
      />
      {/* Ear */}
      <path d="M50 22 C52 18 56 17 57 20 C55 21 53 22 50 22Z" fill="#154734" />
      {/* Eye */}
      <circle cx="55" cy="34" r="2" fill="#f9faf8" />
      {/* Nose */}
      <path d="M58 46 C60 45 62 46 62 48 C62 50 60 51 58 50Z" fill="#1a5c42" />

      {/* Chain links at bottom */}
      <rect x="28" y="72" width="16" height="10" rx="5" stroke="#154734" strokeWidth="4" fill="none" />
      <rect x="56" y="72" width="16" height="10" rx="5" stroke="#154734" strokeWidth="4" fill="none" />
      {/* Link connector */}
      <path d="M44 77 L56 77" stroke="#154734" strokeWidth="4" strokeLinecap="round" />

      {/* Neck connecting to chain */}
      <path d="M42 52 C40 60 36 66 34 72" stroke="#154734" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M56 52 C58 60 62 66 64 72" stroke="#154734" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}
