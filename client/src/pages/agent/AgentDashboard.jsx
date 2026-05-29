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

export default function AgentDashboard() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { orders, setOrders, loading, refetch } = useNearbyOrders();
  
  const [profile, setProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [selected, setSelected] = useState(null);
  const [checkingActive, setCheckingActive] = useState(true);

  // Query for active orders on page load to redirect if task is assigned
  useEffect(() => {
    const checkActiveOrder = async () => {
      try {
        const res = await getAgentActive();
        if (res.data) {
          // If active order exists, route agent to active view immediately
          navigate('/agent/active');
        }
      } catch (err) {
        console.error('Failed to verify active agent deliveries:', err);
      } finally {
        setCheckingActive(false);
      }
    };
    checkActiveOrder();
  }, [navigate]);

  // Fetch agent profile and dynamic stats on mount
  useEffect(() => {
    getMyProfile()
      .then((r) => {
        setProfile(r.data);
        setIsOnline(r.data.isOnline);
      })
      .catch((err) => {
        console.error('Failed to retrieve agent profile details:', err);
      });
  }, []);

  // Join agents room for socket broadcasts
  useEffect(() => {
    if (socket && isOnline) {
      socket.emit('join:agents');
    }
  }, [socket, isOnline]);

  // Handle live socket order listings updates
  useSocketEvent(
    'new:order',
    useCallback(
      (order) => {
        setOrders((prev) => [order, ...prev]);
      },
      [setOrders]
    )
  );

  useSocketEvent(
    'order:cancelled',
    useCallback(
      (data) => {
        setOrders((prev) => prev.filter((o) => o._id !== data.orderId));
      },
      [setOrders]
    )
  );

  // Sync toggle online/offline state
  const handleToggleOnline = async () => {
    try {
      const res = await toggleOnline();
      setIsOnline(res.data.isOnline);
      // Fetch fresh stats to update profile summary on status changes
      const updatedProfile = await getMyProfile();
      setProfile(updatedProfile.data);
    } catch (e) {
      console.error('Failed to update online presence:', e);
      alert('Could not update online status. Please check your network connection.');
    }
  };

  // Enforce online restriction before order acceptance
  const handleAccept = async (orderId) => {
    if (!isOnline) {
      alert('You must go online before accepting deliveries.');
      return;
    }
    try {
      await acceptOrder(orderId);
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      navigate('/agent/active');
    } catch (err) {
      console.error('Accept order error:', err);
      if (err.response?.status === 409) {
        alert('You already have an active delivery in progress.');
        navigate('/agent/active');
      } else {
        alert(err.response?.data?.message || 'Could not accept order.');
      }
    }
  };

  const selectedOrder = orders.find((o) => o._id === selected);

  if (checkingActive) {
    return (
      <div style={{ flex: 1, display: 'flex' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Available Deliveries</div>
        <div className="topbar-actions">
          <div className={`online-toggle ${isOnline ? 'online' : ''}`} onClick={handleToggleOnline}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isOnline ? 'var(--green)' : 'var(--border)',
                display: 'inline-block',
              }}
            />
            {isOnline ? 'Online' : 'Go Online'}
          </div>
          <NotificationBell />
        </div>
      </div>

      <div className="content">
        <div className="list-panel">
          {/* Agent Profile Summary Card */}
          {profile && (
            <div
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                {profile.user?.name
                  ? profile.user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                  : 'A'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-1)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {profile.user?.name}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-2)',
                    display: 'flex',
                    gap: 6,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    marginTop: 3,
                  }}
                >
                  <span style={{ textTransform: 'capitalize' }}>🛵 {profile.vehicleType}</span>
                  <span>•</span>
                  <span>⭐ {profile.rating?.toFixed(1) || '5.0'}</span>
                </div>
                <div
                  style={{
                    fontSize: '9px',
                    color: 'var(--text-2)',
                    display: 'flex',
                    gap: 6,
                    alignItems: 'center',
                    marginTop: 2,
                  }}
                >
                  <span>Active: {profile.stats?.active || 0}</span>
                  <span>•</span>
                  <span>Completed: {profile.stats?.completed || 0}</span>
                  <span>•</span>
                  <span>Today: {profile.stats?.today || 0}</span>
                </div>
              </div>
              <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{isOnline ? '🟢' : '🔴'}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '500',
                    color: isOnline ? 'var(--green)' : 'var(--text-3)',
                  }}
                >
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          )}

          <div className="list-tabs">
            <div className="list-tab active">Available ({orders.length})</div>
            <div className="list-tab" onClick={() => navigate('/agent/active')}>
              My delivery
            </div>
          </div>
          
          <div className="list-panel-scroll">
            {loading ? (
              <LoadingSpinner />
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 32 }}>🏍️</div>
                {isOnline ? 'No deliveries nearby. Stay tuned!' : 'Go online to see available deliveries'}
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order._id}
                  className={`order-card ${selected === order._id ? 'selected' : ''}`}
                  onClick={() => setSelected(order._id)}
                >
                  <div className="oc-top">
                    <div className="oc-id">📦 #{order._id?.slice(-6).toUpperCase()}</div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="oc-addrs" style={{ marginBottom: 8 }}>
                    <div className="oc-addr">📍 {order.pickupAddress}</div>
                    <div className="oc-addr right">🎯 {order.dropAddress}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-2)' }}>📏 Route Assigned</span>
                    <span className="oc-price" style={{ marginLeft: 'auto' }}>
                      {formatPrice(order.price)}
                    </span>
                  </div>
                  <button
                    className="agent-accept-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAccept(order._id);
                    }}
                    disabled={!isOnline}
                    style={{ opacity: isOnline ? 1 : 0.5, cursor: isOnline ? 'pointer' : 'not-allowed' }}
                  >
                    ✅ Accept Delivery
                  </button>
                  <button className="agent-decline-btn">Decline</button>
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