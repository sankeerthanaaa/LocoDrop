const LoadingSpinner = ({ text = 'Loading...' }) => (
  <div className="loading-wrap">
    <div className="spinner" />
    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{text}</span>
  </div>
)

export default LoadingSpinner