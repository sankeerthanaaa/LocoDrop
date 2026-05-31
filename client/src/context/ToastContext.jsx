import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    setToasts((prev) => {
      const isDuplicate = prev.some(t => t.message === message && t.type === type);
      if (isDuplicate) return prev;
      
      const id = Math.random().toString(36).substring(2, 9);
      
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      }, 4000);

      return [...prev, { id, message, type }];
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container overlay */}
      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none'
      }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              background: 'var(--bg-card)',
              border: `1.5px solid ${
                t.type === 'success' ? 'var(--green)' : t.type === 'error' ? 'var(--red)' : 'var(--brand)'
              }`,
              boxShadow: `0 4px 12px rgba(0, 0, 0, 0.5), 0 0 10px ${
                t.type === 'success' ? 'rgba(74, 222, 128, 0.15)' : t.type === 'error' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(205, 242, 2, 0.15)'
              }`,
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              minWidth: '280px',
              maxWidth: '380px',
              animation: 'toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {t.type === 'success' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              )}
              {t.type === 'error' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              )}
              {t.type === 'info' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
              )}
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                padding: 0
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {/* Dynamic Keyframes Injection */}
      <style>{`
        @keyframes toast-slide-in {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
