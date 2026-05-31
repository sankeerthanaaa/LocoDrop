import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder, getPriceEstimate } from '../../api/orders';
import AddressAutocomplete from '../../components/location/AddressAutocomplete';
import MapView from '../../components/common/MapView';

const DEFAULT = {
  pickupAddress: '', pickupCoords: null, pickupFlatNumber: '', pickupLandmark: '',
  dropAddress: '', dropCoords: null, dropFlatNumber: '', dropLandmark: '',
  deliveryInstructions: '', description: '', category: '',
};

// Icons
const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)
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
const IconSend = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const IconLoader = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.7s linear infinite' }}>
    <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>
)
const IconCheckCircle = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const IconAlertCircle = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconSearch = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

export default function PostOrder() {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [estimate, setEstimate] = useState(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState('');

  const setField = field => value => setForm(f => ({ ...f, [field]: value }));

  const handleSelectPickup = ({ address, coords }) => setForm(f => ({ ...f, pickupAddress: address, pickupCoords: coords }));
  const handleSelectDrop = ({ address, coords }) => setForm(f => ({ ...f, dropAddress: address, dropCoords: coords }));
  const handlePickupDragEnd = coords => setForm(f => ({ ...f, pickupCoords: coords }));
  const handleDropDragEnd = coords => setForm(f => ({ ...f, dropCoords: coords }));

  useEffect(() => {
    if (!form.pickupCoords || !form.dropCoords) { setEstimate(null); return; }
    const fetchEstimate = async () => {
      setEstimateLoading(true);
      setEstimateError('');
      try {
        const response = await getPriceEstimate({
          pickupAddress: form.pickupAddress, pickupCoords: form.pickupCoords,
          dropAddress: form.dropAddress, dropCoords: form.dropCoords,
        });
        setEstimate(response.data);
      } catch (err) {
        setEstimateError(err.response?.data?.message || 'Failed to calculate delivery fee.');
      } finally {
        setEstimateLoading(false);
      }
    };
    fetchEstimate();
  }, [form.pickupCoords?.lat, form.pickupCoords?.lng, form.dropCoords?.lat, form.dropCoords?.lng, form.pickupAddress, form.dropAddress]);

  const handleSubmit = async () => {
    const missing = [];
    if (!form.pickupAddress.trim()) {
      missing.push('pickup address');
    } else if (!form.pickupCoords) {
      missing.push('valid pickup coordinates from suggestions');
    }
    
    if (!form.dropAddress.trim()) {
      missing.push('drop address');
    } else if (!form.dropCoords) {
      missing.push('valid drop coordinates from suggestions');
    }

    if (!form.category) {
      missing.push('package category');
    }

    if (missing.length > 0) {
      setError(`Please provide: ${missing.join(', ')}.`);
      return;
    }
    if (estimate && !estimate.serviceAvailable) { setError('Service is not available in these locations yet.'); return; }
    setError('');
    setLoading(true);
    try {
      await createOrder({
        pickupAddress: form.pickupAddress, dropAddress: form.dropAddress,
        pickupCoords: form.pickupCoords, dropCoords: form.dropCoords,
        pickupFlatNumber: form.pickupFlatNumber, pickupLandmark: form.pickupLandmark,
        dropFlatNumber: form.dropFlatNumber, dropLandmark: form.dropLandmark,
        deliveryInstructions: form.deliveryInstructions, description: form.description, category: form.category,
      });
      navigate('/sender/dashboard');
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Failed to post order');
    } finally {
      setLoading(false);
    }
  };

  const isFormDisabled = loading || estimateLoading || !form.pickupCoords || !form.dropCoords || (estimate && !estimate.serviceAvailable);

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <button className="back-btn" onClick={() => navigate('/sender/dashboard')}>
            <IconArrowLeft /> Back
          </button>
          <div className="topbar-title">Post New Order</div>
        </div>
      </div>

      <div className="content">
        <div className="list-panel" style={{ display: 'flex', flexDirection: 'column', flex: '1 1 480px' }}>
          <div className="form-body" style={{ flex: 1, padding: 20 }}>
            {error && <div className="form-error" style={{ display: 'flex', alignItems: 'center', gap: 7 }}><IconAlertCircle />{error}</div>}

            {/* Helpful info box */}
            <div style={{
              background: 'var(--accent-light)',
              border: '1.5px solid var(--border-brand)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '20px',
              fontSize: '12px',
              color: 'var(--text-primary)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: '700', color: 'var(--brand)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Helpful Tips for precise delivery
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-secondary)' }}>
                <li><strong>Pickup/Drop location:</strong> Please enter the city name (e.g. Hyderabad) in the address search for accurate coordinates.</li>
                <li><strong>Adjust map pin:</strong> After selecting an address, drag/pin it on the map on the right to select the exact precise location.</li>

              </ul>
            </div>

            {/* Pickup */}
            <div className="form-section">
              <div className="form-section-title">Pickup Details</div>
              <div className="form-row single">
                <AddressAutocomplete
                  id="pickup-address" label="Pickup address"
                  placeholder="Enter pickup address (e.g. Madhapur)"
                  value={form.pickupAddress} onChange={setField('pickupAddress')} onSelect={handleSelectPickup} required
                />
              </div>
              {form.pickupCoords && (
                <div className="form-row" style={{ marginTop: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Flat / House Number</label>
                    <input className="form-input" placeholder="e.g. Flat 302, Building A"
                      value={form.pickupFlatNumber}
                      onChange={e => setForm(f => ({ ...f, pickupFlatNumber: e.target.value }))} maxLength={100} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Landmark</label>
                    <input className="form-input" placeholder="e.g. Near AIG Hospital"
                      value={form.pickupLandmark}
                      onChange={e => setForm(f => ({ ...f, pickupLandmark: e.target.value }))} maxLength={150} />
                  </div>
                </div>
              )}
            </div>

            {/* Drop */}
            <div className="form-section">
              <div className="form-section-title">Drop Details</div>
              <div className="form-row single">
                <AddressAutocomplete
                  id="drop-address" label="Drop address"
                  placeholder="Enter drop address (e.g. Gachibowli)"
                  value={form.dropAddress} onChange={setField('dropAddress')} onSelect={handleSelectDrop} required
                />
              </div>
              {form.dropCoords && (
                <div className="form-row" style={{ marginTop: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Flat / House Number</label>
                    <input className="form-input" placeholder="e.g. House No. 12-3-45"
                      value={form.dropFlatNumber}
                      onChange={e => setForm(f => ({ ...f, dropFlatNumber: e.target.value }))} maxLength={100} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Landmark</label>
                    <input className="form-input" placeholder="e.g. Opposite Metro Station"
                      value={form.dropLandmark}
                      onChange={e => setForm(f => ({ ...f, dropLandmark: e.target.value }))} maxLength={150} />
                  </div>
                </div>
              )}
            </div>

            {/* Estimate states */}
            {estimateLoading && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconSearch /> Checking availability and calculating fare...
              </div>
            )}
            {!estimateLoading && estimateError && (
              <div style={{ background: 'var(--red-light)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
                <IconAlertCircle /> {estimateError}
              </div>
            )}
            {!estimateLoading && estimate && (
              <div style={{
                background: estimate.serviceAvailable ? 'var(--green-light)' : 'var(--red-light)',
                border: `1.5px solid ${estimate.serviceAvailable ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)'}`,
                padding: '12px 14px', borderRadius: 'var(--radius-md)', fontSize: 12, marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: estimate.serviceAvailable ? 6 : 0 }}>
                  <span style={{ color: estimate.serviceAvailable ? 'var(--green)' : 'var(--red)' }}>
                    {estimate.serviceAvailable ? <IconCheckCircle /> : <IconAlertCircle />}
                  </span>
                  <span style={{ fontWeight: 700, color: estimate.serviceAvailable ? 'var(--green)' : 'var(--red)', fontSize: 13 }}>
                    {estimate.serviceAvailable ? 'Service Available' : 'Service not available in this area yet'}
                  </span>
                </div>
                {estimate.serviceAvailable && (
                  <div style={{ paddingLeft: 20, color: 'var(--text-primary)', display: 'flex', gap: 16 }}>
                    <span><strong style={{ color: 'var(--text-tertiary)' }}>Distance:</strong> {estimate.distanceKm} km</span>
                    <span><strong style={{ color: 'var(--text-tertiary)' }}>Fee:</strong> <span style={{ color: 'var(--brand)', fontFamily: 'Orbitron, sans-serif', fontWeight: 700 }}>₹{estimate.deliveryFee}</span></span>
                  </div>
                )}
              </div>
            )}

            {/* Package */}
            <div className="form-section">
              <div className="form-section-title">Package Details</div>
              <div className="form-row single">
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" rows={2} placeholder="What are you sending?"
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category <span style={{ color: 'var(--red)' }}>*</span></label>
                  <select className="form-select" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required>
                    <option value="">-- Select Category --</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Documents">Documents</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Food">Food</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Instructions</label>
                  <textarea className="form-textarea" rows={2} placeholder="e.g. Call before arrival"
                    value={form.deliveryInstructions}
                    onChange={e => setForm(f => ({ ...f, deliveryInstructions: e.target.value }))} maxLength={300} />
                </div>
              </div>
            </div>

            {/* Summary */}
            {(form.pickupCoords || form.dropCoords) && (
              <div className="form-section" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                <div className="form-section-title" style={{ color: 'var(--brand)' }}>Order Summary</div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {form.pickupCoords && (
                    <div style={{ borderBottom: form.dropCoords ? '1px solid var(--border)' : 'none', paddingBottom: form.dropCoords ? 10 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, fontSize: 12 }}>
                        <span style={{ color: 'var(--brand)' }}><IconMapPin /></span> Pickup
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{form.pickupAddress}</div>
                      {form.pickupFlatNumber && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Flat: {form.pickupFlatNumber}</div>}
                      {form.pickupLandmark && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Landmark: {form.pickupLandmark}</div>}
                    </div>
                  )}
                  {form.dropCoords && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, fontSize: 12 }}>
                        <span style={{ color: 'var(--red)' }}><IconTarget /></span> Drop
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{form.dropAddress}</div>
                      {form.dropFlatNumber && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Flat: {form.dropFlatNumber}</div>}
                      {form.dropLandmark && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Landmark: {form.dropLandmark}</div>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="form-actions" style={{ position: 'sticky', bottom: 0 }}>
            <button className="btn-cancel" onClick={() => navigate('/sender/dashboard')} disabled={loading}>Cancel</button>
            <button className="btn-submit" onClick={handleSubmit} disabled={isFormDisabled}
              style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {loading ? <><IconLoader /> Posting...</> : <><IconSend /> Post Order</>}
            </button>
          </div>
        </div>

        <div className="right-panel">
          <div className="map-area">
            <MapView
              pickupCoords={form.pickupCoords} dropCoords={form.dropCoords}
              pickupDraggable={true} dropDraggable={true}
              onPickupDragEnd={handlePickupDragEnd} onDropDragEnd={handleDropDragEnd}
            />
          </div>
        </div>
      </div>
    </>
  );
}