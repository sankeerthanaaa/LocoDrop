import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyProfile, getAgentById, updateMyProfile } from '../../api/agents';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AgentProfileView() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const isOwnProfile = !id || id === currentUser?.id;
  const isAdmin = currentUser?.role === 'admin';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('bike');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        let res;
        if (isOwnProfile) {
          res = await getMyProfile();
        } else if (isAdmin) {
          res = await getAgentById(id);
        } else {
          setError('Unauthorized to access this profile');
          setLoading(false);
          return;
        }
        setProfile(res.data);
        setPhone(res.data.user?.phone || '');
        setVehicleType(res.data.vehicleType || 'bike');
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, isOwnProfile, isAdmin]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    try {
      // vehicleType is forced/fixed to 'bike' for MVP as per product requirement
      const res = await updateMyProfile({ phone: phone.trim(), vehicleType: 'bike' });
      setProfile(res.data);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error && !profile) {
    return (
      <div className="content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <p style={{ color: 'var(--red)', marginBottom: '16px' }}>{error}</p>
        <button className="tb-btn" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const user = profile?.user || {};
  const stats = profile?.stats || { active: 0, completed: 0, today: 0 };
  const rating = profile?.rating || 5.0;

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          {isOwnProfile ? 'My Profile' : `Agent: ${user.name}`}
        </div>
        <div className="topbar-actions">
          {isAdmin && (
            <button className="tb-btn" onClick={() => navigate('/admin/agents')}>
              Back to List
            </button>
          )}
          {!isOwnProfile && !isAdmin && (
            <button className="tb-btn" onClick={() => navigate(-1)}>
              Back
            </button>
          )}
        </div>
      </div>

      <div className="page-scroll" style={{ padding: '24px 20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          
          {success && (
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--green)', color: 'var(--green)', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>
              {success}
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--red)', color: 'var(--red)', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, flexShrink: 0 }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              {error}
            </div>
          )}

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', position: 'relative' }}>
            
            {/* Header / Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '24px'
              }}>
                {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A'}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-1)', margin: 0 }}>
                  {user.name}
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: '4px 0 0 0' }}>
                  {user.role === 'agent' ? 'Registered Delivery Partner' : user.role}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={profile.isOnline ? 'online-dot' : 'offline-dot'} />
                <span style={{ fontSize: '12px', fontWeight: '500', color: profile.isOnline ? 'var(--green)' : 'var(--text-2)' }}>
                  {profile.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Stats Dashboard Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent)' }}>{stats.active}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>Active Deliveries</div>
              </div>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--green)' }}>{stats.completed}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>Completed</div>
              </div>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ color: 'var(--amber)' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  {rating.toFixed(1)}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>Rating</div>
              </div>
            </div>

            <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

            {/* Details Form / Info */}
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Email Address</label>
                  <input
                    type="text"
                    value={user.email || ''}
                    disabled
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-2)', cursor: 'not-allowed', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter 10-digit phone number"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: isEditing ? '1px solid var(--accent)' : '1px solid var(--border)', background: isEditing ? 'var(--bg)' : 'var(--bg)', color: 'var(--text-1)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Vehicle Type</label>
                  <input
                    type="text"
                    value="Bike"
                    disabled
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-2)', cursor: 'not-allowed', fontSize: '13px' }}
                  />
                  {isEditing && (
                    <span style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                      For the MVP, vehicle type is locked to Bike.
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Joined Date</label>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)', padding: '10px 12px' }}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Last Seen</label>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)', padding: '10px 12px' }}>
                      {profile.lastSeen ? new Date(profile.lastSeen).toLocaleTimeString() : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isOwnProfile && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        className="tb-btn"
                        onClick={() => {
                          setIsEditing(false);
                          setPhone(user.phone || '');
                          setError('');
                        }}
                        style={{ background: 'transparent', border: '1px solid var(--border)' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="agent-accept-btn"
                        style={{ width: 'auto', padding: '8px 16px', margin: 0 }}
                      >
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="agent-accept-btn"
                      onClick={() => setIsEditing(true)}
                      style={{ width: 'auto', padding: '8px 16px', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                      Edit Profile
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
