import StatusBadge from './StatusBadge'
import { formatPrice, getInitials, formatTime } from '../../utils/formatters'

const OrderCard = ({ order, selected, onClick }) => {
  const progressStep = ['posted','accepted','picked_up','delivered'].indexOf(order.status)

  return (
    <div className={`order-card ${selected ? 'selected' : ''}`} onClick={onClick}>
      <div className="oc-top">
        <div className="oc-id">
          📦 #{order._id?.slice(-6).toUpperCase()}
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="oc-progress">
        <div className={`prog-dot ${progressStep >= 1 ? '' : 'empty'}`} />
        <div className={`prog-line ${progressStep >= 2 ? '' : 'empty'}`} />
        <span className="prog-truck">🛵</span>
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
          <div className="oc-waiting">⏳ Waiting for agent...</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="oc-price">{formatPrice(order.price)}</span>
        </div>
      </div>
    </div>
  )
}

export default OrderCard