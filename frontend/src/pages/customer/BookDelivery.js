import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PACKAGE_TYPES, formatCurrency } from '../../utils/helpers';
import MapPicker from '../../components/MapPicker';

const STEPS = ['Locations', 'Package', 'Confirm'];

export default function BookDelivery() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [form, setForm] = useState({
    pickup: { address: '', lat: null, lng: null, contactName: '', contactPhone: '' },
    dropoff: { address: '', lat: null, lng: null, contactName: '', contactPhone: '' },
    packageType: 'other',
    packageDescription: '',
    weight: 1,
    deliverySpeed: 'standard',
    paymentMethod: 'cash',
  });

  const updatePickup = (updates) => setForm(f => ({ ...f, pickup: { ...f.pickup, ...updates } }));
  const updateDropoff = (updates) => setForm(f => ({ ...f, dropoff: { ...f.dropoff, ...updates } }));

  const getEstimate = async () => {
    if (!form.pickup.lat || !form.dropoff.lat) return toast.error('Set both locations on map');
    try {
      const { data } = await api.post('/orders/estimate', {
        pickup: { lat: form.pickup.lat, lng: form.pickup.lng },
        dropoff: { lat: form.dropoff.lat, lng: form.dropoff.lng },
        packageType: form.packageType,
        deliverySpeed: form.deliverySpeed,
        weight: form.weight,
      });
      setEstimate(data);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to get estimate');
    }
  };

  const handleBook = async () => {
    if (!form.pickup.address) return toast.error('Enter pickup address');
    if (!form.dropoff.address) return toast.error('Enter dropoff address');
    setLoading(true);
    try {
      const { data } = await api.post('/orders', form);
      toast.success(`Order placed! Tracking ID: ${data.order.trackingId}`);
      navigate(`/customer/track/${data.order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} className="back-btn">←</button>
        <h2>Book Delivery</h2>
      </div>

      <div className="step-indicator">
        {STEPS.map((s, i) => (
          <div key={s} className={`step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
            <div className="step-dot">{i < step ? '✓' : i + 1}</div>
            <span>{s}</span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="step-content">
          <div className="form-section">
            <h3>📍 Pickup Location</h3>
            <MapPicker value={form.pickup.lat ? { lat: form.pickup.lat, lng: form.pickup.lng } : null}
              onChange={pos => updatePickup(pos)} color="#3b82f6" label="Pickup" />
            <input className="form-input" placeholder="Pickup address (house, street, area)"
              value={form.pickup.address} onChange={e => updatePickup({ address: e.target.value })} />
            <div className="inline-inputs">
              <input className="form-input" placeholder="Sender name" value={form.pickup.contactName}
                onChange={e => updatePickup({ contactName: e.target.value })} />
              <input className="form-input" placeholder="Sender phone" value={form.pickup.contactPhone}
                onChange={e => updatePickup({ contactPhone: e.target.value })} />
            </div>
          </div>

          <div className="form-section">
            <h3>🏠 Dropoff Location</h3>
            <MapPicker value={form.dropoff.lat ? { lat: form.dropoff.lat, lng: form.dropoff.lng } : null}
              onChange={pos => updateDropoff(pos)} color="#22c55e" label="Dropoff" />
            <input className="form-input" placeholder="Dropoff address (house, street, area)"
              value={form.dropoff.address} onChange={e => updateDropoff({ address: e.target.value })} />
            <div className="inline-inputs">
              <input className="form-input" placeholder="Receiver name" value={form.dropoff.contactName}
                onChange={e => updateDropoff({ contactName: e.target.value })} />
              <input className="form-input" placeholder="Receiver phone" value={form.dropoff.contactPhone}
                onChange={e => updateDropoff({ contactPhone: e.target.value })} />
            </div>
          </div>

          <button className="btn-primary" onClick={() => {
            if (!form.pickup.lat || !form.dropoff.lat) return toast.error('Tap on map to set locations');
            if (!form.pickup.address || !form.dropoff.address) return toast.error('Enter both addresses');
            setStep(1);
          }}>Next: Package Details →</button>
        </div>
      )}

      {step === 1 && (
        <div className="step-content">
          <h3>What are you sending?</h3>
          <div className="package-grid">
            {PACKAGE_TYPES.map(pkg => (
              <button key={pkg.value} type="button"
                className={`package-card ${form.packageType === pkg.value ? 'selected' : ''}`}
                onClick={() => setForm(f => ({ ...f, packageType: pkg.value }))}
                style={{ borderColor: form.packageType === pkg.value ? pkg.color : 'transparent' }}>
                <span className="pkg-emoji">{pkg.icon}</span>
                <span>{pkg.label}</span>
              </button>
            ))}
          </div>

          <div className="form-group">
            <label>Description (optional)</label>
            <textarea className="form-input" rows={2} placeholder="Describe your package..."
              value={form.packageDescription}
              onChange={e => setForm(f => ({ ...f, packageDescription: e.target.value }))} />
          </div>

          <div className="form-group">
            <label>Approximate Weight (kg)</label>
            <div className="weight-selector">
              {[0.5, 1, 2, 5, 10].map(w => (
                <button key={w} type="button"
                  className={`weight-btn ${form.weight === w ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, weight: w }))}>
                  {w}kg
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Delivery Speed</label>
            <div className="speed-selector">
              <button type="button" className={`speed-btn ${form.deliverySpeed === 'express' ? 'active' : ''}`}
                onClick={() => setForm(f => ({ ...f, deliverySpeed: 'express' }))}>
                ⚡ Express <small>15-30 min</small>
              </button>
              <button type="button" className={`speed-btn ${form.deliverySpeed === 'standard' ? 'active' : ''}`}
                onClick={() => setForm(f => ({ ...f, deliverySpeed: 'standard' }))}>
                🚴 Standard <small>30-60 min</small>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Payment Method</label>
            <div className="payment-selector">
              {['cash', 'upi'].map(m => (
                <button key={m} type="button"
                  className={`payment-btn ${form.paymentMethod === m ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, paymentMethod: m }))}>
                  {m === 'cash' ? '💵 Cash' : '📱 UPI'}
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary" onClick={getEstimate}>Get Price Estimate →</button>
        </div>
      )}

      {step === 2 && estimate && (
        <div className="step-content">
          <div className="estimate-card">
            <h3>Order Summary</h3>
            <div className="estimate-row"><span>Distance</span><strong>{estimate.distance} km</strong></div>
            <div className="estimate-row"><span>Package</span><strong>{PACKAGE_TYPES.find(p => p.value === form.packageType)?.label}</strong></div>
            <div className="estimate-row"><span>Speed</span><strong>{form.deliverySpeed === 'express' ? '⚡ Express' : '🚴 Standard'}</strong></div>
            <div className="estimate-row"><span>Est. Time</span><strong>~{estimate.estimatedTime} minutes</strong></div>
            <div className="estimate-row"><span>Payment</span><strong>{form.paymentMethod.toUpperCase()}</strong></div>
            <div className="estimate-price">
              <span>Total Price</span>
              <strong>{formatCurrency(estimate.price)}</strong>
            </div>
          </div>

          <div className="address-summary">
            <div className="addr-row">
              <span className="addr-dot pickup-dot">●</span>
              <div>
                <small>Pickup</small>
                <p>{form.pickup.address}</p>
              </div>
            </div>
            <div className="addr-row">
              <span className="addr-dot dropoff-dot">●</span>
              <div>
                <small>Dropoff</small>
                <p>{form.dropoff.address}</p>
              </div>
            </div>
          </div>

          <button className="btn-primary" onClick={handleBook} disabled={loading}>
            {loading ? 'Placing Order...' : `Confirm & Book — ${formatCurrency(estimate.price)}`}
          </button>
          <button className="btn-secondary" onClick={() => setStep(1)}>← Edit Details</button>
        </div>
      )}
    </div>
  );
}
