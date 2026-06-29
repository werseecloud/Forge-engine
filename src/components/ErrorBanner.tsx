export function ErrorBanner({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return <div className="error-banner">{errors.map((error) => <div key={error}>{error}</div>)}</div>;
}

