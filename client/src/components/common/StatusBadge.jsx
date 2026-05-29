import { statusLabel } from '../../utils/formatters'

const StatusBadge = ({ status }) => (
  <span className={`status-badge ${status}`}>
    {statusLabel[status] || status}
  </span>
)

export default StatusBadge