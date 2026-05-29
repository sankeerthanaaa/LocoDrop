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

export default function SenderDashboard() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { orders, setOrders, loading } = useSenderOrders();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('All');
  const [agentCoords, setAgentCoords] = useState(null);

  const nonCancelledOrders = orders.filter((o) => o.status !== 'cancelled');

  // Join rooms for active orders
  const joinRooms = useCallback(() => {
    if (!socket) return;
    socket.emit('join:agents'); // see new posts
    nonCancelledOrders
      .filter((o) => o.status !== 'delivered')
      .forEach((o) => socket.emit('join:order', { orderId: o._id }));
  }, [socket, nonCancelledOrders]);

  // Execute socket rooms joins automatically
  useEffect(() => {
    joinRooms();
  }, [joinRooms]);

  const filtered = filter === 'All' ? nonCancelledOrders : nonCancelledOrders.filter((o) => o.status === filter);
  const selectedOrder = nonCancelledOrders.find((o) => o._id === selected);

  // Load selected order's initial coordinates on change
  useEffect(() => {
    if (selectedOrder?.agent?.currentLocation) {
      setAgentCoords(selectedOrder.agent.currentLocation);
    } else {
      setAgentCoords(null);
    }
  }, [selected, selectedOrder]);

  // Real-time location tracking listener
  useSocketEvent(
    'agent:location',
    useCallback(
      (data) => {
        if (data.orderId === selected) {
          setAgentCoords({ lat: data.lat, lng: data.lng });
        }
      },
      [selected]
    )
  );

  // Real-time: order status changed
  useSocketEvent(
    'order:status',
    useCallback(
      (data) => {
        setOrders((prev) =>
          prev.map((o) => (o._id === data.orderId ? { ...o, status: data.status } : o))
        );
      },
      [setOrders]
    )
  );

  useSocketEvent(
    'order:accepted',
    useCallback(
      (data) => {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === data.orderId
              ? { ...o, status: 'accepted', agent: { name: data.agentName, _id: data.agentId } }
              : o
          )
        );
      },
      [setOrders]
    )
  );

  const stats = {
    total: nonCancelledOrders.length,
    active: nonCancelledOrders.filter((o) => ['accepted', 'picked_up'].includes(o.status)).length,
    delivered: nonCancelledOrders.filter((o) => o.status === 'delivered').length,
    posted: nonCancelledOrders.filter((o) => o.status === 'posted').length,
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-title">Tracking Delivery</div>
        </div>
        <div className="topbar-actions">
          <NotificationBell />
          <button className="tb-btn primary" onClick={() => navigate('/sender/post')}>
            ➕ New Order
          </button>
        </div>
      </div>

      {/* Mini stats row */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
        }}
      >
        {[
          { label: 'Total', val: stats.total, color: 'var(--accent)' },
          { label: 'Active', val: stats.active, color: 'var(--amber)' },
          { label: 'Pending', val: stats.posted, color: 'var(--purple)' },
          { label: 'Done', val: stats.delivered, color: 'var(--green)' },
        ].map(({ label, val, color }) => (
          <div
            key={label}
            style={{
              flex: 1,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              padding: '10px 12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 600, color }}>{val}</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="content">
        {/* Order list */}
        <div className="list-panel">
          <div className="list-tabs">
            <div className="list-tab active">All orders</div>
            <div className="list-tab">Active</div>
            <div className="list-tab">History</div>
          </div>
          <div className="list-filters">
            {FILTERS.map((f) => (
              <div
                key={f}
                className={`filter-chip ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'All' ? 'All' : f.replace('_', ' ')}
              </div>
            ))}
          </div>

          <div className="list-panel-scroll">
            {loading ? (
              <LoadingSpinner />
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 32 }}>📭</div>
                <div>No orders found</div>
                <button
                  className="tb-btn primary"
                  style={{ marginTop: 8 }}
                  onClick={() => navigate('/sender/post')}
                >
                  Post your first order
                </button>
              </div>
            ) : (
              filtered.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  selected={selected === order._id}
                  onClick={() => {
                    setSelected(order._id);
                    navigate(`/sender/orders/${order._id}`);
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Map */}
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