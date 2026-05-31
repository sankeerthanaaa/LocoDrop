import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById, cancelOrder, rateOrder, addOrderFee } from '../../api/orders';
import StatusStepper from '../../components/common/StatusStepper';
import StatusBadge from '../../components/common/StatusBadge';
import MapView from '../../components/common/MapView';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useSocketEvent from '../../hooks/useSocket';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { formatDateTime, formatPrice, getInitials } from '../../utils/formatters';

// Icons
const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)
const IconMapPin = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const IconAlertCircle = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconStar = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? '#F59E0B' : 'none'} stroke={filled ? '#F59E0B' : 'var(--text-tertiary)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer', transition: 'all 0.1s' }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconTimer = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const { showToast } = useToast() || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agentCoords, setAgentCoords] = useState(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [addingFee, setAddingFee] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (order?.status !== 'posted') return;
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, [order?.status]);

  useSocketEvent('order:price_updated', useCallback(data => {
    if (data.orderId === id) {
      setOrder(prev => prev ? { ...prev, price: data.price } : null);
    }
  }, [id]));

  const handleAddFee = async (fee) => {
    setAddingFee(true);
    try {
      const response = await addOrderFee(id, fee);
      setOrder(prev => prev ? { ...prev, price: response.data.price } : null);
      if (showToast) showToast(`Successfully added ₹${fee} fee to your order!`, 'success');
    } catch (err) {
      console.error(err);
      if (showToast) showToast(err.response?.data?.message || 'Failed to add fee.', 'error');
    } finally {
      setAddingFee(false);
    }
  };

  useEffect(() => {
    getOrderById(id)
      .then(r => {
        setOrder(r.data);
        setLoading(false);
        if (r.data.agent?.currentLocation) setAgentCoords(r.data.agent.currentLocation);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (socket && id) socket.emit('join:order', { orderId: id });
  }, [socket, id]);

  useSocketEvent('order:status', useCallback(data => {
    if (data.orderId === id) {
      setOrder(prev => prev ? { ...prev, status: data.status, deliveredAt: data.status === 'delivered' ? new Date() : prev.deliveredAt } : prev);
    }
  }, [id]));

  useSocketEvent('order:accepted', useCallback(data => {
    if (data.orderId === id) {
      setOrder(prev => prev ? { ...prev, status: 'accepted', acceptedAt: new Date(), agent: { name: data.agentName, _id: data.agentId } } : prev);
    }
  }, [id]));

  useSocketEvent('agent:location', useCallback(data => {
    if (data.orderId === id) setAgentCoords({ lat: data.lat, lng: data.lng });
  }, [id]));

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await cancelOrder(id);
      setOrder(p => p ? { ...p, status: 'cancelled' } : null);
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
      alert('Thank you for your rating.');
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to submit rating.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const getDeliveryDuration = () => {
    if (!order?.acceptedAt || !order?.deliveredAt) return null;
    const diff = new Date(order.deliveredAt) - new Date(order.acceptedAt);
    return diff <= 0 ? 0 : Math.round(diff / 60000);
  };

  if (loading) return <div style={{ flex: 1, display: 'flex' }}><LoadingSpinner /></div>;
  if (!order) return <div className="empty-state"><div className="empty-state-title">Order not found</div></div>;

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <button className="back-btn" onClick={() => navigate('/sender/dashboard')}>
            <IconArrowLeft /> Back
          </button>
          <div>
            <div className="topbar-title">#{order._id?.slice(-6).toUpperCase()}</div>
            <div className="topbar-sub">{formatDateTime(order.createdAt)} — {formatPrice(order.price)}</div>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="content">
        <div className="list-panel" style={{ width: 260 }}>
          <div className="detail-scroll">
            {/* Status */}
            <div className="detail-section">
              <div className="detail-section-title">Status</div>
              <StatusStepper status={order.status} />
              {order.status === 'delivered' && getDeliveryDuration() !== null && (
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <IconTimer /> Delivered in {getDeliveryDuration()} mins
                </div>
              )}
            </div>

            {/* Route */}
            <div className="detail-section">
              <div className="detail-section-title">Route</div>
              <div className="route-line">
                <div className="route-point">
                  <div className="route-dot pickup" />
                  <div>
                    <div className="route-addr-label">Pickup</div>
                    <div className="route-addr-text">{order.pickupAddress}</div>
                    {order.pickupFlatNumber && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>Flat: {order.pickupFlatNumber}</div>}
                    {order.pickupLandmark && <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}><IconMapPin />{order.pickupLandmark}</div>}
                  </div>
                </div>
                <div className="route-dash" />
                <div className="route-point">
                  <div className="route-dot drop" />
                  <div>
                    <div className="route-addr-label">Drop</div>
                    <div className="route-addr-text">{order.dropAddress}</div>
                    {order.dropFlatNumber && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>Flat: {order.dropFlatNumber}</div>}
                    {order.dropLandmark && <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}><IconMapPin />{order.dropLandmark}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            {order.deliveryInstructions && (
              <div className="detail-section">
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontFamily: 'Orbitron, sans-serif', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <IconAlertCircle /> Instructions
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>{order.deliveryInstructions}</div>
                </div>
              </div>
            )}

            {/* Agent */}
            {order.agent && (
              <div className="detail-section">
                <div className="detail-section-title">Agent</div>
                <div className="agent-info-card" style={{ cursor: 'pointer' }}
                  onClick={() => setShowAgentModal(true)}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <div className="agent-info-av">{getInitials(order.agent?.name || 'AG')}</div>
                  <div style={{ flex: 1 }}>
                    <div className="agent-info-name">{order.agent?.name}</div>
                    <div className="agent-info-sub">Delivery Agent — click to view</div>
                  </div>
                </div>
                {order.rating !== null && (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    Rated {order.rating} / 5
                  </div>
                )}
              </div>
            )}

            {/* Rate */}
            {order.status === 'delivered' && order.rating === null && (
              <div className="detail-section">
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-brand)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--brand)', fontSize: 11, marginBottom: 8, fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.04em' }}>Rate this delivery</div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                    {[1,2,3,4,5].map(star => (
                      <span key={star} onClick={() => setSelectedRating(star)}>
                        <IconStar filled={star <= selectedRating} />
                      </span>
                    ))}
                  </div>
                  <button className="tb-btn primary" onClick={handleSubmitRating}
                    disabled={selectedRating === 0 || ratingSubmitting}
                    style={{ width: '100%', justifyContent: 'center', padding: '7px' }}>
                    {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
                  </button>
                </div>
              </div>
            )}

            {/* Order info */}
            <div className="detail-section">
              <div className="detail-section-title">Order Info</div>
              <div className="info-row"><span className="info-key">Order ID</span><span className="info-val">#{order._id?.slice(-6).toUpperCase()}</span></div>
              <div className="info-row"><span className="info-key">Price</span><span className="info-val" style={{ color: 'var(--brand)', fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(order.price)}</span></div>
              <div className="info-row"><span className="info-key">Item</span><span className="info-val">{order.description || '—'}</span></div>
              <div className="info-row"><span className="info-key">Posted</span><span className="info-val" style={{ fontSize: 11 }}>{formatDateTime(order.createdAt)}</span></div>
            </div>

            {/* Fee escalation prompt */}
            {order.status === 'posted' && (now - new Date(order.createdAt).getTime()) > 10 * 60 * 1000 && (
              <div className="detail-section" style={{
                background: 'rgba(251, 209, 90, 0.05)',
                border: '1.5px dashed var(--amber)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ fontWeight: 700, color: 'var(--amber)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Orbitron, sans-serif' }}>
                  <IconAlertCircle /> No Agents Accepting Yet
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  Sorry, nobody is accepting your delivery right now. Try adding a fee to attract nearby agents.
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {[10, 20, 30, 50].map(fee => (
                    <button
                      key={fee}
                      className="tb-btn"
                      disabled={addingFee}
                      onClick={() => handleAddFee(fee)}
                      style={{ padding: '4px 10px', fontSize: 11, background: 'var(--bg-input)', border: '1px solid var(--border)' }}
                    >
                      +₹{fee}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {['posted', 'accepted'].includes(order.status) && (
              <button className="cancel-order-btn" onClick={handleCancel}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <IconX /> Cancel Order
              </button>
            )}
          </div>
        </div>

        <div className="right-panel">
          <div className="map-area">
            <MapView pickupCoords={order.pickupCoords} dropCoords={order.dropCoords} agentCoords={agentCoords} status={order.status} />
          </div>
        </div>
      </div>

      {/* Agent Modal */}
      {showAgentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(25, 27, 29, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowAgentModal(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, width: 340, maxWidth: '90%', boxShadow: 'var(--shadow-lg)', position: 'relative', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>
            
            {/* Header border accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--brand), transparent)' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--brand)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>📡 Agent Dossier</div>
              <button onClick={() => setShowAgentModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color var(--transition)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                <IconX />
              </button>
            </div>

            {/* Profile Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--bg-input)', border: '2px solid var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--brand)', fontFamily: 'Orbitron, sans-serif', fontSize: 16, flexShrink: 0 }}>
                {getInitials(order.agent?.name || 'AG')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {order.agent?.name || 'Rider'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    background: order.agent?.profile?.isOnline ? 'rgba(74, 222, 128, 0.1)' : 'rgba(135, 142, 136, 0.15)',
                    color: order.agent?.profile?.isOnline ? 'var(--green)' : 'var(--text-secondary)',
                    border: `1px solid ${order.agent?.profile?.isOnline ? 'rgba(74, 222, 128, 0.25)' : 'var(--border)'}`
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: order.agent?.profile?.isOnline ? 'var(--green)' : 'var(--text-secondary)' }} />
                    {order.agent?.profile?.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Grid stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                {
                  label: 'Rating',
                  val: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      {(order.agent?.profile?.rating || 5.0).toFixed(1)}
                    </div>
                  ),
                  color: 'var(--amber)'
                },
                { label: 'Deliveries', val: `${order.agent?.profile?.totalDeliveries || 0} completed`, color: 'var(--green)' },
                {
                  label: 'Vehicle',
                  val: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="18" r="2.5" /><circle cx="18.5" cy="18" r="2.5" /><path d="M5.5 18l5-6.5h6l2 6.5" /><path d="M10.5 11.5l1.5-4.5h4" /></svg>
                      {order.agent?.profile?.vehicleType || 'Bike'}
                    </div>
                  ),
                  color: 'var(--brand)'
                },
                { label: 'Task Status', val: order.status.replace('_', ' '), color: 'var(--status-posted-text)', isCapitalize: true }
              ].map(({ label, val, color, isCapitalize }) => (
                <div key={label} style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  <span style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color, textTransform: isCapitalize ? 'capitalize' : 'none' }}>{val}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </>
  );
}