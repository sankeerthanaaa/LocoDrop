import StatusBadge from './StatusBadge'
import { formatPrice, getInitials, formatTime } from '../../utils/formatters'

const IconPackage = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, flexShrink: 0 }}>
    <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
  </svg>
)

const IconBike = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="5.5" cy="18" r="2.5" />
    <circle cx="18.5" cy="18" r="2.5" />
    <path d="M5.5 18l5-6.5h6l2 6.5" />
    <path d="M10.5 11.5l1.5-4.5h4" />
  </svg>
)

const IconClock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const OrderCard = ({ order, selected, onClick }) => {
  const progressStep = ['posted','accepted','picked_up','delivered'].indexOf(order.status)

  return (
    <div className={`order-card ${selected ? 'selected' : ''}`} onClick={onClick}>
      <div className="oc-top">
        <div className="oc-id" style={{ display: 'flex', alignItems: 'center' }}>
          <IconPackage /> #{order._id?.slice(-6).toUpperCase()}
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="oc-progress">
        <div className={`prog-dot ${progressStep >= 1 ? '' : 'empty'}`} />
        <div className={`prog-line ${progressStep >= 2 ? '' : 'empty'}`} />
        <span className={`prog-truck ${progressStep >= 2 ? '' : 'empty'}`} style={{ display: 'flex', alignItems: 'center' }}>
          <IconBike />
        </span>
        <div className={`prog-line ${progressStep >= 3 ? '' : 'empty'}`} />
        <div className={`prog-dot ${progressStep >= 3 ? '' : 'empty'}`} />
      </div>

      <div className="oc-addrs">
        <div className="oc-addr">{order.pickupAddress}</div>
        <div className="oc-addr right">{order.dropAddress}</div>
      </div>

      <div className="oc-footer">
        {order.agent ? (
          <div className="oc-agent">
            <div className="oc-av">{getInitials(order.agent?.name || 'AG')}</div>
            <div>
              <div className="oc-agent-name">{order.agent?.name || 'Agent'}</div>
              <div className="oc-agent-sub">Agent</div>
            </div>
          </div>
        ) : (
          <div className="oc-waiting" style={{ display: 'flex', alignItems: 'center', fontSize: 11, color: 'var(--text-tertiary)' }}>
            <IconClock /> Waiting for agent...
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="oc-price">{formatPrice(order.price)}</span>
        </div>
      </div>
    </div>
  )
}

export default OrderCard