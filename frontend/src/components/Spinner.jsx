export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="d-flex justify-content-center align-items-center gap-2 py-5 text-secondary">
      <div className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
