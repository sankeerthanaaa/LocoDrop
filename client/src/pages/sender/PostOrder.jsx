import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder, getPriceEstimate } from '../../api/orders';
import AddressAutocomplete from '../../components/location/AddressAutocomplete';
import MapView from '../../components/common/MapView';

const DEFAULT = {
  pickupAddress: '',
  pickupCoords: null,
  pickupFlatNumber: '',
  pickupLandmark: '',
  dropAddress: '',
  dropCoords: null,
  dropFlatNumber: '',
  dropLandmark: '',
  deliveryInstructions: '',
  description: '',
  category: 'Groceries',
};

export default function PostOrder() {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estimate state
  const [estimate, setEstimate] = useState(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState('');

  const setField = (field) => (value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSelectPickup = ({ address, coords }) => {
    setForm((f) => ({
      ...f,
      pickupAddress: address,
      pickupCoords: coords,
    }));
  };

  const handleSelectDrop = ({ address, coords }) => {
    setForm((f) => ({
      ...f,
      dropAddress: address,
      dropCoords: coords,
    }));
  };

  const handlePickupDragEnd = (coords) => {
    setForm((f) => ({
      ...f,
      pickupCoords: coords,
    }));
  };

  const handleDropDragEnd = (coords) => {
    setForm((f) => ({
      ...f,
      dropCoords: coords,
    }));
  };

  // Fetch delivery pricing and service availability check from the backend on location selection
  useEffect(() => {
    if (!form.pickupCoords || !form.dropCoords) {
      setEstimate(null);
      return;
    }

    const fetchEstimate = async () => {
      setEstimateLoading(true);
      setEstimateError('');
      try {
        const response = await getPriceEstimate({
          pickupAddress: form.pickupAddress,
          pickupCoords: form.pickupCoords,
          dropAddress: form.dropAddress,
          dropCoords: form.dropCoords,
        });
        setEstimate(response.data);
      } catch (err) {
        console.error('Failed to get price estimate:', err);
        setEstimateError(err.response?.data?.message || 'Failed to calculate delivery fee.');
      } finally {
        setEstimateLoading(false);
      }
    };

    fetchEstimate();
  }, [
    form.pickupCoords?.lat,
    form.pickupCoords?.lng,
    form.dropCoords?.lat,
    form.dropCoords?.lng,
    form.pickupAddress,
    form.dropAddress,
  ]);

  const handleSubmit = async () => {
    if (!form.pickupAddress || !form.dropAddress) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!form.pickupCoords) {
      setError('Please select a valid pickup address from the suggestions.');
      return;
    }

    if (!form.dropCoords) {
      setError('Please select a valid drop address from the suggestions.');
      return;
    }

    if (estimate && !estimate.serviceAvailable) {
      setError('Service is not available in these locations yet.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await createOrder({
        pickupAddress: form.pickupAddress,
        dropAddress: form.dropAddress,
        pickupCoords: form.pickupCoords,
        dropCoords: form.dropCoords,
        pickupFlatNumber: form.pickupFlatNumber,
        pickupLandmark: form.pickupLandmark,
        dropFlatNumber: form.dropFlatNumber,
        dropLandmark: form.dropLandmark,
        deliveryInstructions: form.deliveryInstructions,
        description: form.description,
        category: form.category,
      });
      navigate('/sender/dashboard');
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err.message || err.response?.data?.message || 'Failed to post order');
    } finally {
      setLoading(false);
    }
  };

  const isFormDisabled =
    loading ||
    estimateLoading ||
    !form.pickupCoords ||
    !form.dropCoords ||
    (estimate && !estimate.serviceAvailable);

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <button className="back-btn" onClick={() => navigate('/sender/dashboard')}>
            ← Back
          </button>
          <div className="topbar-title">Post New Order</div>
        </div>
      </div>

      <div className="content">
        {/* Left Form Panel */}
        <div className="list-panel" style={{ display: 'flex', flexDirection: 'column', flex: '1 1 480px', overflowY: 'auto' }}>
          <div className="form-body" style={{ flex: 1, padding: '20px' }}>
            {error && (
              <div className="auth-err" style={{ marginBottom: 16 }}>
                {error}
              </div>
            )}

            {/* Pickup Details */}
            <div className="form-section">
              <div className="form-section-title">Pickup details</div>
              <div className="form-row single">
                <AddressAutocomplete
                  id="pickup-address"
                  label="Pickup address"
                  placeholder="Enter pickup address (e.g. Madhapur)"
                  value={form.pickupAddress}
                  onChange={setField('pickupAddress')}
                  onSelect={handleSelectPickup}
                  required
                />
              </div>
              {form.pickupCoords && (
                <div className="form-row" style={{ marginTop: '10px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="pickup-flat">Flat / House Number</label>
                    <input
                      id="pickup-flat"
                      className="form-input"
                      placeholder="e.g. Flat 302, Building A"
                      value={form.pickupFlatNumber}
                      onChange={(e) => setForm(f => ({ ...f, pickupFlatNumber: e.target.value }))}
                      maxLength={100}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="pickup-landmark">Landmark</label>
                    <input
                      id="pickup-landmark"
                      className="form-input"
                      placeholder="e.g. Near AIG Hospital"
                      value={form.pickupLandmark}
                      onChange={(e) => setForm(f => ({ ...f, pickupLandmark: e.target.value }))}
                      maxLength={150}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Drop Details */}
            <div className="form-section">
              <div className="form-section-title">Drop details</div>
              <div className="form-row single">
                <AddressAutocomplete
                  id="drop-address"
                  label="Drop address"
                  placeholder="Enter drop address (e.g. Gachibowli)"
                  value={form.dropAddress}
                  onChange={setField('dropAddress')}
                  onSelect={handleSelectDrop}
                  required
                />
              </div>
              {form.dropCoords && (
                <div className="form-row" style={{ marginTop: '10px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="drop-flat">Flat / House Number</label>
                    <input
                      id="drop-flat"
                      className="form-input"
                      placeholder="e.g. House No. 12-3-45"
                      value={form.dropFlatNumber}
                      onChange={(e) => setForm(f => ({ ...f, dropFlatNumber: e.target.value }))}
                      maxLength={100}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="drop-landmark">Landmark</label>
                    <input
                      id="drop-landmark"
                      className="form-input"
                      placeholder="e.g. Opposite Metro Station"
                      value={form.dropLandmark}
                      onChange={(e) => setForm(f => ({ ...f, dropLandmark: e.target.value }))}
                      maxLength={150}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Service Check Banner */}
            {estimateLoading && (
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-2)', padding: '10px 14px', borderRadius: 'var(--r-md)', fontSize: '12px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⏳</span>
                <span>Checking service availability & calculating fare...</span>
              </div>
            )}

            {!estimateLoading && estimateError && (
              <div style={{ background: 'var(--red-light)', border: '1px solid var(--red)', color: 'var(--red-dark)', padding: '10px 14px', borderRadius: 'var(--r-md)', fontSize: '12px', marginBottom: 22 }}>
                ⚠️ {estimateError}
              </div>
            )}

            {!estimateLoading && estimate && (
              <div style={{ background: estimate.serviceAvailable ? 'var(--green-light)' : 'var(--red-light)', border: `1.5px solid ${estimate.serviceAvailable ? 'var(--green)' : 'var(--red)'}`, color: estimate.serviceAvailable ? 'var(--green-dark)' : 'var(--red-dark)', padding: '12px 14px', borderRadius: 'var(--r-md)', fontSize: '12px', fontWeight: '500', marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{estimate.serviceAvailable ? '✓' : '⚠'}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>
                    {estimate.serviceAvailable ? 'Service Available' : 'Service not available in this area yet'}
                  </span>
                </div>
                {estimate.serviceAvailable && (
                  <div style={{ paddingLeft: 20, color: 'var(--text-1)', fontSize: '12px', marginTop: 4 }}>
                    <div style={{ marginBottom: 2 }}>
                      <strong>Distance:</strong> {estimate.distanceKm} km
                    </div>
                    <div>
                      <strong>Delivery Fee:</strong> ₹{estimate.deliveryFee}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Package details */}
            <div className="form-section">
              <div className="form-section-title">Package details</div>
              <div className="form-row single">
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea form-input"
                    rows={2}
                    placeholder="What are you sending?"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    <option>Groceries</option>
                    <option>Documents</option>
                    <option>Electronics</option>
                    <option>Food</option>
                    <option>Medicine</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="delivery-instructions">Delivery Instructions</label>
                  <textarea
                    id="delivery-instructions"
                    className="form-textarea form-input"
                    rows={2}
                    placeholder="e.g. Call before arrival, leave at gate"
                    value={form.deliveryInstructions}
                    onChange={(e) => setForm((f) => ({ ...f, deliveryInstructions: e.target.value }))}
                    maxLength={300}
                  />
                </div>
              </div>
            </div>

            {/* Location Summary verification card */}
            {(form.pickupCoords || form.dropCoords) && (
              <div className="form-section" style={{ background: 'var(--accent-light)', border: '1.5px solid var(--accent)', borderRadius: 'var(--r-lg)', padding: '16px', marginTop: '20px' }}>
                <div className="form-section-title" style={{ color: 'var(--accent)', fontWeight: '700', marginBottom: '12px' }}>🔍 Summary & Verification</div>
                <div style={{ display: 'grid', gap: '14px' }}>
                  {form.pickupCoords && (
                    <div style={{ borderBottom: form.dropCoords ? '1px solid var(--border)' : 'none', paddingBottom: form.dropCoords ? '12px' : '0' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-1)', marginBottom: '4px' }}>📦 Pickup Details</div>
                      <div style={{ color: 'var(--text-2)', fontSize: '12px' }}>{form.pickupAddress}</div>
                      {form.pickupFlatNumber && <div style={{ fontSize: '11px', color: 'var(--text-2)', marginTop: '2px' }}>🏢 Flat/House: {form.pickupFlatNumber}</div>}
                      {form.pickupLandmark && <div style={{ fontSize: '11px', color: 'var(--text-2)' }}>📍 Landmark: {form.pickupLandmark}</div>}
                      <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px', fontFamily: 'monospace' }}>🛰️ Pin: {form.pickupCoords.lat.toFixed(5)}, {form.pickupCoords.lng.toFixed(5)} (Adjusted)</div>
                    </div>
                  )}
                  {form.dropCoords && (
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-1)', marginBottom: '4px' }}>🎯 Drop Details</div>
                      <div style={{ color: 'var(--text-2)', fontSize: '12px' }}>{form.dropAddress}</div>
                      {form.dropFlatNumber && <div style={{ fontSize: '11px', color: 'var(--text-2)', marginTop: '2px' }}>🏢 Flat/House: {form.dropFlatNumber}</div>}
                      {form.dropLandmark && <div style={{ fontSize: '11px', color: 'var(--text-2)' }}>📍 Landmark: {form.dropLandmark}</div>}
                      <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px', fontFamily: 'monospace' }}>🛰️ Pin: {form.dropCoords.lat.toFixed(5)}, {form.dropCoords.lng.toFixed(5)} (Adjusted)</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="form-actions" style={{ position: 'sticky', bottom: 0 }}>
            <button className="btn-cancel" onClick={() => navigate('/sender/dashboard')} disabled={loading}>
              Cancel
            </button>
            <button className="btn-submit" onClick={handleSubmit} disabled={isFormDisabled}>
              {loading ? '🚀 Posting order...' : '🚀 Post Order'}
            </button>
          </div>
        </div>

        {/* Right Map Panel */}
        <div className="right-panel">
          <div className="map-area">
            <MapView
              pickupCoords={form.pickupCoords}
              dropCoords={form.dropCoords}
              pickupDraggable={true}
              dropDraggable={true}
              onPickupDragEnd={handlePickupDragEnd}
              onDropDragEnd={handleDropDragEnd}
            />
          </div>
        </div>
      </div>
    </>
  );
}