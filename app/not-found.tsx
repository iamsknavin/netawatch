import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <p className="font-mono text-accent text-xs uppercase tracking-widest mb-4">404</p>
      <h1 className="text-3xl font-bold text-text-primary mb-4">
        Page not found
      </h1>
      <p className="text-text-secondary text-sm mb-8">
        This politician, party, or page doesn&apos;t exist in our database yet.
      </p>
      <div className="flex gap-4 justify-center">
        <Link
          href="/"
          className="font-mono text-sm border border-accent text-accent px-4 py-2 hover:bg-accent hover:text-bg transition-colors"
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
