import { cn } from "@/lib/ui";

type BrandMarkProps = {
  className?: string;
  compact?: boolean;
};

export function BrandMark({ className, compact = false }: BrandMarkProps) {
  return (
    <div className={cn("brand-mark", compact ? "brand-mark--compact" : "", className)}>
      <span className="brand-mark__metal">
        NN<sup>2</sup>
      </span>
      {!compact ? <span className="brand-mark__full">Noel Newman News Network</span> : null}
    </div>
  );
}
