import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderCard from '../../components/common/OrderCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import MapView from '../../components/common/MapView';
import NotificationBell from '../../components/common/NotificationBell';
import { useSenderOrders } from '../../hooks/useOrders';
import useSocketEvent from '../../hooks/useSocket';
import { useSocket } from '../../context/SocketContext';

const FILTERS = ['All', 'posted', 'accepted', 'picked_up', 'delivered'];

// Icons
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconPackage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
)
const IconActivity = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconCheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const IconInbox = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </svg>
)

export default function SenderDashboard() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { orders, setOrders, loading } = useSenderOrders();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('All');
  const [agentCoords, setAgentCoords] = useState(null);

  const nonCancelledOrders = orders.filter(o => o.status !== 'cancelled');

  const joinRooms = useCallback(() => {
    if (!socket) return;
    socket.emit('join:agents');
    nonCancelledOrders
      .filter(o => o.status !== 'delivered')
      .forEach(o => socket.emit('join:order', { orderId: o._id }));
  }, [socket, nonCancelledOrders]);

  useEffect(() => { joinRooms(); }, [joinRooms]);

  const filtered = filter === 'All' ? nonCancelledOrders : nonCancelledOrders.filter(o => o.status === filter);
  const selectedOrder = nonCancelledOrders.find(o => o._id === selected);

  useEffect(() => {
    if (selectedOrder?.agent?.currentLocation) setAgentCoords(selectedOrder.agent.currentLocation);
    else setAgentCoords(null);
  }, [selected, selectedOrder]);

  useSocketEvent('agent:location', useCallback(data => {
    if (data.orderId === selected) setAgentCoords({ lat: data.lat, lng: data.lng });
  }, [selected]));

  useSocketEvent('order:status', useCallback(data => {
    setOrders(prev => prev.map(o => o._id === data.orderId ? { ...o, status: data.status } : o));
  }, [setOrders]));

  useSocketEvent('order:accepted', useCallback(data => {
    setOrders(prev => prev.map(o =>
      o._id === data.orderId ? { ...o, status: 'accepted', agent: { name: data.agentName, _id: data.agentId } } : o
    ));
  }, [setOrders]));

  const stats = {
    total: nonCancelledOrders.length,
    active: nonCancelledOrders.filter(o => ['accepted', 'picked_up'].includes(o.status)).length,
    delivered: nonCancelledOrders.filter(o => o.status === 'delivered').length,
    posted: nonCancelledOrders.filter(o => o.status === 'posted').length,
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-title">Track Deliveries</div>
        </div>
        <div className="topbar-actions">
          <NotificationBell />
          <button className="tb-btn primary" onClick={() => navigate('/sender/post')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconPlus /> New Order
          </button>
        </div>
      </div>


      <div className="content">
        <div className="list-panel">
          <div className="list-tabs">
            <div className="list-tab active">All Orders</div>
            <div className="list-tab">Active</div>
            <div className="list-tab">History</div>
          </div>
          <div className="list-filters">
            {FILTERS.map(f => (
              <div key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'All' ? 'All' : f.replace('_', ' ')}
              </div>
            ))}
          </div>
          <div className="list-panel-scroll">
            {loading ? (
              <LoadingSpinner />
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                  <IconInbox />
                </div>
                <div className="empty-state-title">No orders found</div>
                <div className="empty-state-sub">Post your first delivery order to get started.</div>
                <button className="tb-btn primary" style={{ marginTop: 10 }} onClick={() => navigate('/sender/post')}>
                  Post Order
                </button>
              </div>
            ) : (
              filtered.map(order => (
                <OrderCard
                  key={order._id}
                  order={order}
                  selected={selected === order._id}
                  onClick={() => { setSelected(order._id); navigate(`/sender/orders/${order._id}`); }}
                />
              ))
            )}
          </div>
        </div>

        <div className="right-panel">
          <div className="map-area">
            <MapView
              pickupCoords={selectedOrder?.pickupCoords}
              dropCoords={selectedOrder?.dropCoords}
              agentCoords={agentCoords}
              status={selectedOrder?.status}
            />
          </div>
        </div>
      </div>
    </>
  );
}