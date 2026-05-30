import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateStatus } from '../../api/orders';
import { updateLocation } from '../../api/agents';
import { useSocket } from '../../context/SocketContext';
import useSocketEvent from '../../hooks/useSocket';
import MapView from '../../components/common/MapView';
import StatusStepper from '../../components/common/StatusStepper';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useAgentActiveOrder from '../../hooks/useAgentActiveOrder';
import { formatPrice, getInitials, formatDateTime } from '../../utils/formatters';

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
const IconPhone = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.38 2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.12 6.12l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)
const IconPackage = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
)
const IconNavigation = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconTruck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
)
const IconDollarSign = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)
const IconAlertCircle = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

export default function ActiveDelivery() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { activeOrder, loading: activeLoading, error: activeError } = useAgentActiveOrder();
  const [order, setOrder] = useState(null);
  const [myCoords, setMyCoords] = useState(null);

  useEffect(() => {
    if (activeOrder) setOrder(activeOrder);
    else if (!activeLoading) setOrder(null);
  }, [activeOrder, activeLoading]);

  useEffect(() => {
    if (socket && order) socket.emit('join:order', { orderId: order._id });
  }, [socket, order]);

  useSocketEvent('order:status', useCallback(data => {
    if (order && data.orderId === order._id) {
      setOrder(prev => prev ? { ...prev, status: data.status } : null);
    }
  }, [order]));

  useSocketEvent('order:cancelled', useCallback(data => {
    if (order && data.orderId === order._id) {
      alert('This order has been cancelled by the sender.');
      setOrder(null);
      navigate('/agent/dashboard');
    }
  }, [order, navigate]));

  const handleUpdateLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyCoords(coords);
        await updateLocation(coords.lat, coords.lng);
        if (socket && order) socket.emit('update:location', { orderId: order._id, ...coords });
      },
      err => {
        console.error('Geolocation update failed:', err);
        alert('Unable to retrieve location. Check browser location permissions.');
      }
    );
  };

  const handleStatus = async newStatus => {
    if (!order) return;
    try {
      await updateStatus(order._id, newStatus);
      if (newStatus === 'delivered') {
        alert('Delivery completed.');
        setOrder(null);
        navigate('/agent/dashboard');
      } else {
        setOrder(p => p ? { ...p, status: newStatus } : null);
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update status.');
    }
  };

  if (activeLoading) return <div style={{ flex: 1, display: 'flex' }}><LoadingSpinner /></div>;

  if (activeError) return (
    <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ color: 'var(--red)', display: 'flex' }}><IconAlertCircle /></div>
      <div className="empty-state-title">Something went wrong</div>
      <div className="empty-state-sub">{activeError}</div>
      <button className="btn btn-primary" onClick={() => navigate('/agent/dashboard')}>Go to Dashboard</button>
    </div>
  );

  if (!order) return (
    <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ color: 'var(--text-tertiary)', display: 'flex' }}><IconTruck /></div>
      <div className="empty-state-title">No active delivery</div>
      <div className="empty-state-sub">You have no delivery in progress right now.</div>
      <button className="btn btn-primary btn-sm" onClick={() => navigate('/agent/dashboard')}>
        <IconArrowLeft /> Find Orders
      </button>
    </div>
  );

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <button className="back-btn" onClick={() => navigate('/agent/dashboard')}>
            <IconArrowLeft /> Back
          </button>
          <div>
            <div className="topbar-title">Active Delivery — #{order._id?.slice(-6).toUpperCase()}</div>
            <div className="topbar-sub" style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
              In progress
            </div>
          </div>
        </div>
        <span className={`status-badge ${order.status}`}>
          <span className="status-badge-dot" />
          {order.status.replace('_', ' ')}
        </span>
      </div>

      <div className="content">
        {/* Detail panel */}
        <div className="list-panel" style={{ width: 280, display: 'flex', flexDirection: 'column' }}>
          <div className="detail-scroll" style={{ flex: 1 }}>

            {/* Earnings Banner */}
            <div className="earnings-banner">
              <div className="earnings-banner-icon">
                <IconDollarSign />
              </div>
              <div>
                <div className="earnings-banner-label">Your Earnings</div>
                <div className="earnings-banner-value">{formatPrice(order.price)}</div>
                <div className="earnings-banner-sub">Credited on delivery</div>
              </div>
            </div>

            {/* Delivery Progress */}
            <div className="detail-section" style={{ padding: '0 14px', marginTop: 14 }}>
              <div className="detail-section-title">Delivery Progress</div>
              <StatusStepper status={order.status} />
            </div>

            {/* Pickup Info */}
            <div className="detail-section" style={{ padding: '0 14px' }}>
              <div className="detail-section-title">Pickup Information</div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--brand)', marginTop: 3, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3, fontFamily: 'Orbitron, sans-serif' }}>Pickup Point</div>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>{order.pickupAddress}</div>
                    {order.pickupFlatNumber && (
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>Flat / House: {order.pickupFlatNumber}</div>
                    )}
                    {order.pickupLandmark && (
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <IconMapPin /> {order.pickupLandmark}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Drop Info */}
            <div className="detail-section" style={{ padding: '0 14px' }}>
              <div className="detail-section-title">Drop Information</div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--red)', marginTop: 3, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3, fontFamily: 'Orbitron, sans-serif' }}>Drop Point</div>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>{order.dropAddress}</div>
                    {order.dropFlatNumber && (
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>Flat / House: {order.dropFlatNumber}</div>
                    )}
                    {order.dropLandmark && (
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <IconMapPin /> {order.dropLandmark}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Instructions */}
            {order.deliveryInstructions && (
              <div className="detail-section" style={{ padding: '0 14px' }}>
                <div style={{ background: 'var(--amber-light)', border: '1px solid rgba(251,209,90,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontFamily: 'Orbitron, sans-serif', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <IconAlertCircle /> Instructions
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>{order.deliveryInstructions}</div>
                </div>
              </div>
            )}

            {/* Sender Details */}
            <div className="detail-section" style={{ padding: '0 14px' }}>
              <div className="detail-section-title">Sender Details</div>
              <div className="agent-info-card">
                <div className="agent-info-av" style={{ background: 'var(--amber-light)', color: 'var(--amber)', borderColor: 'rgba(251,209,90,0.3)' }}>
                  {getInitials(order.sender?.name || 'SN')}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="agent-info-name">{order.sender?.name || 'Sender'}</div>
                  <div className="agent-info-sub">Customer</div>
                </div>
              </div>
            </div>

            {/* Order meta */}
            <div className="detail-section" style={{ padding: '0 14px' }}>
              <div className="info-row">
                <span className="info-key">Item</span>
                <span className="info-val">{order.description || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Accepted at</span>
                <span className="info-val" style={{ fontSize: 11 }}>{formatDateTime(order.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="action-btn-bar">
            {order.status === 'accepted' && (
              <button className="action-btn pickup" onClick={() => handleStatus('picked_up')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <IconPackage /> Mark Picked Up
              </button>
            )}
            {order.status === 'picked_up' && (
              <button className="action-btn delivered" onClick={() => handleStatus('delivered')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <IconCheck /> Mark Delivered
              </button>
            )}
          </div>
          <div style={{ padding: '6px 12px 12px' }}>
            <button className="action-btn location" style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }} onClick={handleUpdateLocation}>
              <IconNavigation /> Update My Location
            </button>
          </div>
        </div>

        <div className="right-panel">
          <div className="map-area">
            <MapView
              pickupCoords={order.pickupCoords}
              dropCoords={order.dropCoords}
              agentCoords={myCoords}
              status={order.status}
            />
          </div>
        </div>
      </div>
    </>
  );
}