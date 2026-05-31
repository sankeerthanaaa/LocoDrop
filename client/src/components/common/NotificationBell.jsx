import { useState, useEffect, useRef, useCallback } from 'react';
import { getNotifications, markAllRead } from '../../api/notifications.js';
import useSocketEvent from '../../hooks/useSocket.js';
import { useToast } from '../../context/ToastContext.jsx';

const IconBell = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const ref = useRef(null);
  const { showToast } = useToast() || {};

  // Fetch initial notifications on mount
  useEffect(() => {
    getNotifications()
      .then(({ data }) => {
        setNotifs(data);
        const unreadCount = data.filter((n) => !n.isRead).length;
        if (unreadCount > 0 && showToast) {
          showToast(`You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.`, 'info');
        }
      })
      .catch((err) => console.error('Failed to load notifications:', err));
  }, [showToast]);

  // Listen for real-time notification socket broadcasts
  useSocketEvent(
    'notification:new',
    useCallback((notif) => {
      setNotifs((prev) => [notif, ...prev]);
      if (showToast) {
        showToast(notif.message, 'info');
      }
    }, [showToast])
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
      <button className="notif-btn" onClick={() => setOpen((o) => !o)} title="Notifications" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconBell />
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