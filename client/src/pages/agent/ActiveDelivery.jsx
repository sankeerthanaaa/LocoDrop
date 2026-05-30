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

export default function ActiveDelivery() {
  const navigate = useNavigate();
  const socket = useSocket();
  
  // Expose active order state through the reusable custom hook
  const { activeOrder, loading: activeLoading, error: activeError, refetch } = useAgentActiveOrder();
  const [order, setOrder] = useState(null);
  const [myCoords, setMyCoords] = useState(null);

  // Sync component state with active hook fetch result
  useEffect(() => {
    if (activeOrder) {
      setOrder(activeOrder);
    } else if (!activeLoading) {
      setOrder(null);
    }
  }, [activeOrder, activeLoading]);

  // Join the order Socket room when the order becomes available
  useEffect(() => {
    if (socket && order) {
      socket.emit('join:order', { orderId: order._id });
    }
  }, [socket, order]);

  // Live order status updates via Socket.io
  useSocketEvent(
    'order:status',
    useCallback(
      (data) => {
        if (order && data.orderId === order._id) {
          setOrder((prev) => (prev ? { ...prev, status: data.status } : null));
        }
      },
      [order]
    )
  );

  // Live order cancellation handling via Socket.io
  useSocketEvent(
    'order:cancelled',
    useCallback(
      (data) => {
        if (order && data.orderId === order._id) {
          alert('This order has been cancelled by the sender.');
          setOrder(null);
          navigate('/agent/dashboard');
        }
      },
      [order, navigate]
    )
  );

  const handleUpdateLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyCoords(coords);
        await updateLocation(coords.lat, coords.lng);
        if (socket && order) {
          socket.emit('update:location', { orderId: order._id, ...coords });
        }
      },
      (err) => {
        console.error('Geolocation update failed:', err);
        alert('Unable to retrieve your current location. Please check your browser location access permissions.');
      }
    );
  };

  const handleStatus = async (newStatus) => {
    if (!order) return;
    try {
      await updateStatus(order._id, newStatus);
      if (newStatus === 'delivered') {
        alert('Delivery completed successfully.');
        setOrder(null);
        navigate('/agent/dashboard');
      } else {
        setOrder((p) => (p ? { ...p, status: newStatus } : null));
      }
    } catch (e) {
      console.error('Error updating delivery status:', e);
      alert(e.response?.data?.message || 'Failed to update order status.');
    }
  };

  if (activeLoading) {
    return (
      <div style={{ flex: 1, display: 'flex' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (activeError) {
    return (
      <div
        className="empty-state"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div>{activeError}</div>
        <button className="tb-btn primary" onClick={() => navigate('/agent/dashboard')}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div
        className="empty-state"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 40 }}>🛵</div>
        <div>No active delivery right now</div>
        <button className="tb-btn primary" onClick={() => navigate('/agent/dashboard')}>
          ← Find Orders
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <button className="back-btn" onClick={() => navigate('/agent/dashboard')}>
            ← Back
          </button>
          <div>
            <div className="topbar-title">Active Delivery · #{order._id?.slice(-6).toUpperCase()}</div>
            <div className="topbar-sub" style={{ color: 'var(--green)' }}>
              ● In progress
            </div>
          </div>
        </div>
        <span className={`status-badge ${order.status}`}>{order.status.replace('_', ' ')}</span>
      </div>

      <div className="content">
        <div className="list-panel" style={{ width: 260, display: 'flex', flexDirection: 'column' }}>
          <div className="detail-scroll" style={{ flex: 1 }}>
            <div className="detail-section">
              <div className="detail-section-title">Delivery status</div>
              <StatusStepper status={order.status} />
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
              <div className="detail-section" style={{ background: 'rgba(245, 158, 11, 0.05)', borderRadius: 'var(--r-md)', padding: '10px 12px', border: '1.5px solid var(--border)' }}>
                <div style={{ fontWeight: '600', color: 'var(--amber-dark)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>📢 Delivery Instructions</div>
                <div style={{ fontSize: '12px', color: 'var(--text-1)', lineHeight: 1.4 }}>
                  {order.deliveryInstructions}
                </div>
              </div>
            )}

            <div className="detail-section">
              <div className="detail-section-title">Sender</div>
              <div className="agent-info-card">
                <div
                  className="agent-info-av"
                  style={{ background: 'var(--amber-light)', color: 'var(--amber-dark)' }}
                >
                  {getInitials(order.sender?.name || 'SN')}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="agent-info-name">{order.sender?.name || 'Sender'}</div>
                  <div className="agent-info-sub">Customer</div>
                </div>
                <div className="oc-action-btn">📞</div>
              </div>
            </div>

            <div className="detail-section">
              <div className="info-row">
                <span className="info-key">Earnings</span>
                <span className="info-val" style={{ color: 'var(--green)' }}>
                  {formatPrice(order.price)}
                </span>
              </div>
              <div className="info-row">
                <span className="info-key">Item</span>
                <span className="info-val">{order.description || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Accepted at</span>
                <span className="info-val">{formatDateTime(order.updatedAt)}</span>
              </div>
            </div>
          </div>

          <div className="action-btn-bar">
            {order.status === 'accepted' && (
              <button className="action-btn pickup" onClick={() => handleStatus('picked_up')}>
                📦 Mark Picked Up
              </button>
            )}
            {order.status === 'picked_up' && (
              <button className="action-btn delivered" onClick={() => handleStatus('delivered')}>
                ✅ Mark Delivered
              </button>
            )}
          </div>
          <div style={{ padding: '0 12px 12px', display: 'flex', gap: 8 }}>
            <button className="action-btn location" style={{ flex: 1 }} onClick={handleUpdateLocation}>
              📍 Update Location
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