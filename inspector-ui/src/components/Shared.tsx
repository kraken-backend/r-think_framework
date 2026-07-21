export function Loading() {
  return (
    <div className="loading" role="status" aria-label="Loading">
      <span className="spinner" />
      Loading...
    </div>
  );
}

export function Empty({ message = "No data available" }: { message?: string }) {
  return (
    <div className="empty-state" role="status">
      <div className="icon">📭</div>
      <p>{message}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="error-state" role="alert">
      <div className="icon">⚠</div>
      <p>{message}</p>
    </div>
  );
}

export function JsonViewer({ data, label }: { data: unknown; label?: string }) {
  return (
    <div>
      {label && <div className="card-title">{label}</div>}
      <pre className="json-viewer">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
