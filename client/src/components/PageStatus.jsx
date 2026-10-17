// Centered loading spinner, or a short message when `children` is given.
export default function PageStatus({ children }) {
  return (
    <div className="page-status" role="status">
      {children ?? <span className="spinner" aria-label="Loading" />}
    </div>
  );
}
