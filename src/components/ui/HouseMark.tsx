interface HouseMarkProps {
  className?: string;
  /**
   * `light`: aro y casa en navy — para usar sobre fondos claros (header, footer claro).
   * `dark`: aro dorado y casa blanca — para usar sobre fondos navy (footer oscuro, redes).
   * Replica el isologo real de la marca (casa dentro de un aro).
   */
  variant?: 'light' | 'dark';
}

export function HouseMark({ className, variant = 'light' }: HouseMarkProps) {
  const isDark = variant === 'dark';
  const ringColor = isDark ? '#C6A667' : '#0F1C2E';
  const houseColor = isDark ? '#FBFAF7' : '#0F1C2E';

  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden>
      <circle cx="50" cy="50" r="46" stroke={ringColor} strokeWidth="3" />
      <path d="M50 24 L76 47 L69 47 L69 76 L31 76 L31 47 L24 47 Z" fill={houseColor} />
      <rect x="41" y="56" width="7" height="20" fill={isDark ? '#0F1C2E' : '#FBFAF7'} />
      <rect x="52" y="56" width="7" height="20" fill={isDark ? '#0F1C2E' : '#FBFAF7'} />
    </svg>
  );
}
