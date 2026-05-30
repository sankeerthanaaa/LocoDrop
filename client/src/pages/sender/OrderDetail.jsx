import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById, cancelOrder, rateOrder } from '../../api/orders';
import StatusStepper from '../../components/common/StatusStepper';
import StatusBadge from '../../components/common/StatusBadge';
import MapView from '../../components/common/MapView';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useSocketEvent from '../../hooks/useSocket';
import { useSocket } from '../../context/SocketContext';
import { formatDateTime, formatPrice, getInitials } from '../../utils/formatters';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agentCoords, setAgentCoords] = useState(null);
  const [showAgentModal, setShowAgentModal] = useState(false);

  // Rating input state
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  useEffect(() => {
    getOrderById(id)
      .then((r) => {
        setOrder(r.data);
        setLoading(false);
        // Load initial agent coordinates on page load
        if (r.data.agent?.currentLocation) {
          setAgentCoords(r.data.agent.currentLocation);
        }
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (socket && id) socket.emit('join:order', { orderId: id });
  }, [socket, id]);

  useSocketEvent(
    'order:status',
    useCallback(
      (data) => {
        if (data.orderId === id) {
          setOrder((prev) => (prev ? { ...prev, status: data.status, deliveredAt: data.status === 'delivered' ? new Date() : prev.deliveredAt } : prev));
        }
      },
      [id]
    )
  );

  useSocketEvent(
    'order:accepted',
    useCallback(
      (data) => {
        if (data.orderId === id) {
          setOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'accepted',
                  acceptedAt: new Date(),
                  agent: { name: data.agentName, _id: data.agentId },
                }
              : prev
          );
        }
      },
      [id]
    )
  );

  useSocketEvent(
    'agent:location',
    useCallback(
      (data) => {
        if (data.orderId === id) {
          setAgentCoords({ lat: data.lat, lng: data.lng });
        }
      },
      [id]
    )
  );

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await cancelOrder(id);
      setOrder((p) => (p ? { ...p, status: 'cancelled' } : null));
    } catch (e) {
      alert(e.response?.data?.message || 'Cannot cancel');
    }
  };

  const handleSubmitRating = async () => {
    if (selectedRating < 1 || selectedRating > 5) return;
    setRatingSubmitting(true);
    try {
      const res = await rateOrder(id, selectedRating);
      setOrder(res.data);
      alert('Thank you for rating your delivery.');
    } catch (err) {
      console.error('Failed to submit rating:', err);
      alert(err.response?.data?.message || 'Unable to submit rating.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const getDeliveryDuration = () => {
    if (!order?.acceptedAt || !order?.deliveredAt) return null;
    const accepted = new Date(order.acceptedAt);
    const delivered = new Date(order.deliveredAt);
    const diffMs = delivered - accepted;
    if (diffMs <= 0) return 0;
    return Math.round(diffMs / 60000);
  };

  if (loading) return <div style={{ flex: 1, display: 'flex' }}><LoadingSpinner /></div>;
  if (!order) return <div className="empty-state">Order not found</div>;

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <button className="back-btn" onClick={() => navigate('/sender/dashboard')}>
            ← Back
          </button>
          <div>
            <div className="topbar-title">#{order._id?.slice(-6).toUpperCase()}</div>
            <div className="topbar-sub">
              {formatDateTime(order.createdAt)} · {formatPrice(order.price)}
            </div>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="content">
        <div className="list-panel" style={{ width: 260 }}>
          <div className="detail-scroll">
            <div className="detail-section">
              <div className="detail-section-title">Status</div>
              <StatusStepper status={order.status} />
              {order.status === 'delivered' && getDeliveryDuration() !== null && (
                <div style={{ marginTop: 10, fontSize: '12px', fontWeight: '600', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>⏱️ Delivered in {getDeliveryDuration()} mins</span>
                </div>
              )}
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Route</div>
              <div className="route-line">
                <div className="route-point">
                  <div className="route-dot pickup" />
                  <div>
                    <div className="route-addr-label">Pickup</div>
                    <div className="route-addr-text">{order.pickupAddress}</div>
                    {(order.pickupFlatNumber || order.pickupLandmark) && (
                      <div style={{ fontSize: '11px', color: 'var(--text-2)', marginTop: 4 }}>
                        {order.pickupFlatNumber && <div style={{ marginBottom: 2 }}>🏢 Flat/House: {order.pickupFlatNumber}</div>}
                        {order.pickupLandmark && <div>📍 Landmark: {order.pickupLandmark}</div>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="route-dash" />
                <div className="route-point">
                  <div className="route-dot drop" />
                  <div>
                    <div className="route-addr-label">Drop</div>
                    <div className="route-addr-text">{order.dropAddress}</div>
                    {(order.dropFlatNumber || order.dropLandmark) && (
                      <div style={{ fontSize: '11px', color: 'var(--text-2)', marginTop: 4 }}>
                        {order.dropFlatNumber && <div style={{ marginBottom: 2 }}>🏢 Flat/House: {order.dropFlatNumber}</div>}
                        {order.dropLandmark && <div>📍 Landmark: {order.dropLandmark}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {order.deliveryInstructions && (
              <div className="detail-section" style={{ background: 'rgba(79, 110, 247, 0.05)', borderRadius: 'var(--r-md)', padding: '10px 12px', border: '1.5px solid var(--border)' }}>
                <div style={{ fontWeight: '600', color: 'var(--accent)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>📢 Delivery Instructions</div>
                <div style={{ fontSize: '12px', color: 'var(--text-1)', lineHeight: 1.4 }}>
                  {order.deliveryInstructions}
                </div>
              </div>
            )}

            {order.agent && (
              <div className="detail-section">
                <div className="detail-section-title">Agent</div>
                <div 
                  className="agent-info-card" 
                  onClick={() => setShowAgentModal(true)}
                  style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--border)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                >
                  <div className="agent-info-av">{getInitials(order.agent?.name || 'AG')}</div>
                  <div style={{ flex: 1 }}>
                    <div className="agent-info-name">{order.agent?.name}</div>
                    <div className="agent-info-sub">🛵 Agent (Click to view)</div>
                  </div>
                </div>

                {/* Rating Display */}
                {order.rating !== null && (
                  <div style={{ fontSize: '11px', color: 'var(--text-2)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>⭐</span>
                    <span>Rated {order.rating} / 5 stars</span>
                  </div>
                )}
              </div>
            )}

            {/* Interactive Rating Component */}
            {order.status === 'delivered' && order.rating === null && (
              <div
                className="detail-section"
                style={{
                  background: 'var(--accent-light)',
                  padding: '12px 14px',
                  borderRadius: 'var(--r-lg)',
                  border: '1.5px solid var(--accent)',
                  marginTop: 14,
                }}
              >
                <div style={{ fontWeight: '600', color: 'var(--accent)', fontSize: '12px', marginBottom: 6 }}>
                  Rate this delivery
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => setSelectedRating(star)}
                      style={{
                        fontSize: 22,
                        cursor: 'pointer',
                        color: star <= selectedRating ? '#F59E0B' : 'var(--text-3)',
                        transition: 'color 0.1s',
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <button
                  className="tb-btn primary"
                  onClick={handleSubmitRating}
                  disabled={selectedRating === 0 || ratingSubmitting}
                  style={{ width: '100%', justifyContent: 'center', padding: '6px' }}
                >
                  {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            )}

            <div className="detail-section">
              <div className="detail-section-title">Order Info</div>
              <div className="info-row">
                <span className="info-key">Order ID</span>
                <span className="info-val">#{order._id?.slice(-6).toUpperCase()}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Price</span>
                <span className="info-val">{formatPrice(order.price)}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Item</span>
                <span className="info-val">{order.description || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Posted</span>
                <span className="info-val">{formatDateTime(order.createdAt)}</span>
              </div>
            </div>

            {['posted', 'accepted'].includes(order.status) && (
              <button className="cancel-order-btn" onClick={handleCancel}>
                Cancel Order
              </button>
            )}
          </div>
        </div>

        <div className="right-panel">
          <div className="map-area">
            <MapView
              pickupCoords={order.pickupCoords}
              dropCoords={order.dropCoords}
              agentCoords={agentCoords}
              status={order.status}
            />
          </div>
        </div>
      </div>

      {showAgentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowAgentModal(false)}>
          <div style={{
            background: 'var(--bg-card, #1A1D2D)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            width: '320px',
            maxWidth: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: 'var(--text-1)' }}>Agent Profile</h3>
              <button onClick={() => setShowAgentModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600
              }}>
                {getInitials(order.agent?.name || 'AG')}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{order.agent?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className={(order.agent?.profile?.isOnline) ? 'online-dot' : 'offline-dot'} style={{ width: 6, height: 6 }} />
                  {order.agent?.profile?.isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-2)' }}>Vehicle Type</span>
                <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>🛵 Bike</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-2)' }}>Rating</span>
                <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>⭐ {order.agent?.profile?.rating?.toFixed(1) || '5.0'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-2)' }}>Completed Deliveries</span>
                <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{order.agent?.profile?.totalDeliveries || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}