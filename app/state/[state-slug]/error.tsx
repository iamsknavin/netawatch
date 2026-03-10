"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <p className="font-mono text-danger text-xs uppercase tracking-widest mb-4">
        Error
      </p>
      <h1 className="text-2xl font-bold text-text-primary mb-4">
        Something went wrong
      </h1>
      <p className="text-text-secondary text-sm mb-8 max-w-md mx-auto">
        {error.message || "Could not load state data. The data may be temporarily unavailable."}
      </p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => reset()}
          className="font-mono text-sm border border-accent text-accent px-4 py-2 hover:bg-accent hover:text-bg transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="font-mono text-sm border border-border text-text-secondary px-4 py-2 hover:border-text-secondary transition-colors"
        >
          Home
        </Link>
        <Link
          href="/politicians"
          className="font-mono text-sm border border-border text-text-secondary px-4 py-2 hover:border-text-secondary transition-colors"
        >
          Browse MPs
        </Link>
      </div>
    </div>
  );
}
