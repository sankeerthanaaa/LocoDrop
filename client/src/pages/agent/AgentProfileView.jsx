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
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--green)', color: 'var(--green)', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
              ✅ {success}
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--red)', color: 'var(--red)', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
              ❌ {error}
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
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--amber)' }}>⭐ {rating.toFixed(1)}</div>
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
                    <span style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px', display: 'block' }}>
                      ℹ️ For the MVP, vehicle type is locked to Bike.
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
                      style={{ width: 'auto', padding: '8px 16px', margin: 0 }}
                    >
                      ✏️ Edit Profile
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
