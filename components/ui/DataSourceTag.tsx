import { DATA_SOURCES } from "@/lib/config";

type SourceKey = keyof typeof DATA_SOURCES;

interface DataSourceTagProps {
  source: SourceKey | string;
  url?: string;
  label?: string;
  className?: string;
}

/**
 * Every data point must show its source.
 * Use this component to attribute data.
 */
export function DataSourceTag({ source, url, label, className }: DataSourceTagProps) {
  const knownSource =
    source in DATA_SOURCES
      ? DATA_SOURCES[source as SourceKey]
      : null;

  const displayLabel = label ?? knownSource?.name ?? source;
  const href = url ?? knownSource?.url;

  return (
    <span className={`inline-flex items-center gap-1 text-2xs font-mono text-text-muted border border-border/50 px-1.5 py-0.5 rounded-sm ${className ?? ""}`}>
      <span className="text-text-muted opacity-60">src:</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-accent transition-colors underline-offset-2 hover:underline"
        >
          {displayLabel}
        </a>
      ) : (
        <span>{displayLabel}</span>
      )}
    </span>
  );
}
