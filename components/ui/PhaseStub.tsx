interface PhaseStubProps {
  phase: 2 | 3;
  feature: string;
  description?: string;
}

export function PhaseStub({ phase, feature, description }: PhaseStubProps) {
  return (
    <div className="border border-border/50 border-dashed rounded-sm p-8 text-center">
      <div className="inline-block bg-surface-2 border border-border px-3 py-1 rounded-sm mb-4">
        <span className="font-mono text-2xs text-text-secondary uppercase tracking-widest">
          Phase {phase} Feature
        </span>
      </div>
      <h3 className="font-mono text-text-primary text-sm font-semibold mb-2">
        {feature}
      </h3>
      {description && (
        <p className="text-text-secondary text-xs max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}
      <p className="text-text-muted text-2xs mt-4 font-mono">
        Schema ready · Pipeline stub in /scraper · Activates when PHASE_CONFIG.current ≥ {phase}
      </p>
    </div>
  );
}
