type ProgressRingSize = 'sm' | 'lg';

interface ProgressRingProps {
  progress: number; // 0-1
  size?: ProgressRingSize;
  /** The one module/screen whose ring gets the accent treatment — at most one per screen. */
  isFrontier?: boolean;
}

const SIZE_CONFIG: Record<ProgressRingSize, { diameter: number; stroke: number; fontSize: number }> = {
  sm: { diameter: 40, stroke: 4, fontSize: 11 },
  lg: { diameter: 64, stroke: 5, fontSize: 15 },
};

/**
 * The shared progress identity element — Home's module nodes and the
 * Module page header use the exact same component, so advancing a module
 * visibly transforms both. 0% still renders a real "0%" — a bare empty
 * circle with no number is the zero-state glyph this replaces.
 */
export function ProgressRing({ progress, size = 'sm', isFrontier = false }: ProgressRingProps) {
  const { diameter, stroke, fontSize } = SIZE_CONFIG[size];
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clamped);
  const isComplete = clamped >= 1;
  const center = diameter / 2;

  const arcColorClass = isComplete ? 'stroke-success' : isFrontier ? 'stroke-accent' : 'stroke-text-muted';

  return (
    <svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`} role="img" aria-label={`${Math.round(clamped * 100)}% complete`}>
      <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={stroke} className="stroke-border" />
      {clamped > 0 && (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          className={`${arcColorClass} transition-[stroke-dashoffset] duration-300 ease-out-motion motion-reduce:transition-none`}
        />
      )}
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={fontSize} className="fill-text font-medium">
        {isComplete ? '✓' : `${Math.round(clamped * 100)}%`}
      </text>
    </svg>
  );
}
