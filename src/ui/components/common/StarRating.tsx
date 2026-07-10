interface StarRatingProps {
  stars: number; // 0-5
}

export function StarRating({ stars }: StarRatingProps) {
  const clamped = Math.max(0, Math.min(5, stars));
  return (
    <span aria-label={`${clamped} of 5 stars`} className="font-mono text-xs tracking-wide text-accent">
      {'★'.repeat(clamped)}
      <span className="text-border">{'★'.repeat(5 - clamped)}</span>
    </span>
  );
}
