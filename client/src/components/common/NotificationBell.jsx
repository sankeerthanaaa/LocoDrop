import { useState, useEffect, useRef, useCallback } from 'react';
import { getNotifications, markAllRead } from '../../api/notifications.js';
import useSocketEvent from '../../hooks/useSocket.js';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const ref = useRef(null);

  // Fetch initial notifications on mount
  useEffect(() => {
    getNotifications()
      .then(({ data }) => setNotifs(data))
      .catch((err) => console.error('Failed to load notifications:', err));
  }, []);

  // Listen for real-time notification socket broadcasts
  useSocketEvent(
    'notification:new',
    useCallback((notif) => {
      setNotifs((prev) => [notif, ...prev]);
    }, [])
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter((n) => !n.isRead).length;

  const handleMarkAll = async (e) => {
    e.stopPropagation();
    try {
      await markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="notif-btn" onClick={() => setOpen((o) => !o)} title="Notifications">
        🔔
        {unread > 0 && <span className="notif-dot" />}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span>Notifications {unread > 0 && `(${unread})`}</span>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                style={{
                  fontSize: 11,
                  color: 'var(--accent)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                }}
              >
                Mark all read
              </button>
            )}
          </div>
          <div style={{ maxHeight: 250, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div
                style={{
                  padding: '20px 14px',
                  textAlign: 'center',
                  fontSize: 12,
                  color: 'var(--text-3)',
                }}
              >
                No notifications
              </div>
            ) : (
              notifs.slice(0, 8).map((n) => (
                <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''}`}>
                  <div className="notif-item-msg">{n.message}</div>
                  <div className="notif-item-time">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}