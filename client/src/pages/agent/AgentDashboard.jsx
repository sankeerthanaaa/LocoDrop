import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { acceptOrder, getAgentActive } from '../../api/orders';
import { toggleOnline, getMyProfile } from '../../api/agents';
import { useNearbyOrders } from '../../hooks/useOrders';
import useSocketEvent from '../../hooks/useSocket';
import { useSocket } from '../../context/SocketContext';
import StatusBadge from '../../components/common/StatusBadge';
import MapView from '../../components/common/MapView';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import NotificationBell from '../../components/common/NotificationBell';
import { formatPrice } from '../../utils/formatters';

// Icons
const IconMapPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const IconTarget = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)
const IconPackage = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconTruck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
)
const IconStar = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconCoin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
  </svg>
)

export default function AgentDashboard() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { orders, setOrders, loading, refetch } = useNearbyOrders();

  const [profile, setProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [selected, setSelected] = useState(null);
  const [checkingActive, setCheckingActive] = useState(true);

  useEffect(() => {
    const checkActiveOrder = async () => {
      try {
        const res = await getAgentActive();
        if (res.data) navigate('/agent/active');
      } catch (err) {
        console.error('Failed to verify active agent deliveries:', err);
      } finally {
        setCheckingActive(false);
      }
    };
    checkActiveOrder();
  }, [navigate]);

  useEffect(() => {
    getMyProfile()
      .then(r => { setProfile(r.data); setIsOnline(r.data.isOnline); })
      .catch(err => console.error('Failed to retrieve agent profile:', err));
  }, []);

  useEffect(() => {
    if (socket && isOnline) socket.emit('join:agents');
  }, [socket, isOnline]);

  useSocketEvent('new:order', useCallback(order => {
    setOrders(prev => [order, ...prev]);
  }, [setOrders]));

  useSocketEvent('order:cancelled', useCallback(data => {
    setOrders(prev => prev.filter(o => o._id !== data.orderId));
  }, [setOrders]));

  useSocketEvent('agent:stats', useCallback(stats => {
    setProfile(prev => prev ? { ...prev, stats } : null);
  }, [setProfile]));

  const handleToggleOnline = async () => {
    try {
      const res = await toggleOnline();
      setIsOnline(res.data.isOnline);
      const updatedProfile = await getMyProfile();
      setProfile(updatedProfile.data);
    } catch (e) {
      console.error('Failed to update online presence:', e);
      alert('Could not update online status.');
    }
  };

  const handleAccept = async orderId => {
    if (!isOnline) { alert('Go online before accepting deliveries.'); return; }
    try {
      await acceptOrder(orderId);
      setOrders(prev => prev.filter(o => o._id !== orderId));
      navigate('/agent/active');
    } catch (err) {
      console.error('Accept order error:', err);
      if (err.response?.status === 409) { alert('You already have an active delivery.'); navigate('/agent/active'); }
      else alert(err.response?.data?.message || 'Could not accept order.');
    }
  };

  const selectedOrder = orders.find(o => o._id === selected);

  if (checkingActive) return <div style={{ flex: 1, display: 'flex' }}><LoadingSpinner /></div>;

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div>
            <div className="topbar-title">Available Deliveries</div>
            <div className="topbar-sub">
              {orders.length} order{orders.length !== 1 ? 's' : ''} nearby
            </div>
          </div>
        </div>
        <div className="topbar-actions">
          {/* Online / Offline toggle */}
          <div
            className={`online-toggle ${isOnline ? 'online' : ''}`}
            onClick={handleToggleOnline}
            style={{ cursor: 'pointer' }}
          >
            <div className="status-indicator" style={{ gap: 6 }}>
              <div className={`status-pulse ${isOnline ? '' : ''}`}
                style={{ width: 7, height: 7, borderRadius: '50%', background: isOnline ? 'var(--green)' : 'var(--text-tertiary)', flexShrink: 0,
                  ...(isOnline ? { animation: 'pulse-ring 1.8s ease-out infinite' } : {}) }}
              />
              <span className="online-toggle-label" style={{ fontSize: 12, fontWeight: 600, color: isOnline ? 'var(--green)' : 'var(--text-secondary)' }}>
                {isOnline ? 'Online' : 'Go Online'}
              </span>
            </div>
            <div className={`toggle-switch ${isOnline ? 'on' : ''}`} />
          </div>
          <NotificationBell />
        </div>
      </div>

      {/* Stats strip for agent */}
      {profile && (
        <div style={{ display: 'flex', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-surface)' }}>
          <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', flexShrink: 0 }}>
              <IconCoin />
            </div>
            <div>
              <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 15, fontWeight: 800, color: 'var(--brand)' }}>
                {formatPrice(profile.stats?.todayEarnings || 0)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>Today's Earnings</div>
            </div>
          </div>
          <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)', flexShrink: 0 }}>
              <IconTruck />
            </div>
            <div>
              <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                {profile.stats?.today || 0}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>Delivered Today</div>
            </div>
          </div>
          <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: 'var(--amber-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber)', flexShrink: 0 }}>
              <IconStar />
            </div>
            <div>
              <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                {(profile.rating || 5.0).toFixed(1)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>Avg Rating</div>
            </div>
          </div>
        </div>
      )}

      <div className="content">
        <div className="list-panel">
          <div className="list-tabs">
            <div className="list-tab active">Available ({orders.length})</div>
            <div className="list-tab" onClick={() => navigate('/agent/active')}>My Delivery</div>
          </div>

          <div className="list-panel-scroll">
            {loading ? (
              <LoadingSpinner />
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-tertiary)', opacity: 0.4 }}>
                  <IconTruck />
                </div>
                <div className="empty-state-title">No deliveries nearby</div>
                <div className="empty-state-sub">
                  {isOnline ? 'Stay tuned — new orders will appear here.' : 'Go online to see available deliveries.'}
                </div>
              </div>
            ) : (
              orders.map(order => (
                <div
                  key={order._id}
                  className={`order-card ${selected === order._id ? 'selected' : ''}`}
                  onClick={() => setSelected(order._id)}
                >
                  <div className="oc-top">
                    <div className="oc-id">
                      <IconPackage />
                      #{order._id?.slice(-6).toUpperCase()}
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="oc-addrs">
                    <div className="oc-addr" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ color: 'var(--brand)', flexShrink: 0 }}><IconMapPin /></span>
                      {order.pickupAddress}
                    </div>
                    <div className="oc-addr" style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                      <span style={{ color: 'var(--red)', flexShrink: 0 }}><IconTarget /></span>
                      {order.dropAddress}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 2 }}>
                    <span className="oc-price">{formatPrice(order.price)}</span>
                  </div>
                  <button
                    className="agent-accept-btn"
                    onClick={e => { e.stopPropagation(); handleAccept(order._id); }}
                    disabled={!isOnline}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <IconCheck /> Accept Delivery
                  </button>
                  <button
                    className="agent-decline-btn"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <IconX /> Decline
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="right-panel">
          <div className="map-area">
            <MapView
              pickupCoords={selectedOrder?.pickupCoords}
              dropCoords={selectedOrder?.dropCoords}
              status={selectedOrder?.status}
            />
          </div>
        </div>
      </div>
    </>
  );
}