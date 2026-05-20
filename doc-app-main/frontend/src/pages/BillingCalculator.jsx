import React, { useMemo, useState } from "react";
import "./BillingCalculator.css";

// Minimal doctor list with numeric fees for calculation
const DOCTORS = [
  { id: 1, name: "Dr. Richard James", specialty: "General Physician", fee: 120 },
  { id: 2, name: "Dr. Emily Larson", specialty: "Gynecologist", fee: 150 },
  { id: 3, name: "Dr. Sarah Patel", specialty: "Dermatologist", fee: 130 },
  { id: 4, name: "Dr. Michael Chen", specialty: "Cardiologist", fee: 180 },
  { id: 5, name: "Dr. Lisa Rodriguez", specialty: "Pediatrician", fee: 100 },
];

const currency = (n) =>
  (isNaN(n) ? 0 : n).toLocaleString(undefined, { style: "currency", currency: "USD" });

const BillingCalculator = () => {
  const [doctorId, setDoctorId] = useState(1);
  const [sessions, setSessions] = useState(1);
  const [extraItems, setExtraItems] = useState([
    // { id: 1, label: "Lab Tests", amount: 40 }
  ]);
  const [discountPct, setDiscountPct] = useState(0);
  const [taxPct, setTaxPct] = useState(5);
  const [paidAmount, setPaidAmount] = useState(0);

  const selectedDoctor = useMemo(
    () => DOCTORS.find((d) => d.id === Number(doctorId)) || DOCTORS[0],
    [doctorId]
  );

  const itemsSubtotal = useMemo(
    () => extraItems.reduce((acc, i) => acc + (Number(i.amount) || 0), 0),
    [extraItems]
  );

  const consultSubtotal = useMemo(() => (Number(sessions) || 0) * selectedDoctor.fee, [sessions, selectedDoctor]);

  const subtotal = useMemo(() => consultSubtotal + itemsSubtotal, [consultSubtotal, itemsSubtotal]);

  const discountAmount = useMemo(() => (subtotal * (Number(discountPct) || 0)) / 100, [subtotal, discountPct]);

  const taxable = useMemo(() => Math.max(subtotal - discountAmount, 0), [subtotal, discountAmount]);

  const taxAmount = useMemo(() => (taxable * (Number(taxPct) || 0)) / 100, [taxable, taxPct]);

  const total = useMemo(() => taxable + taxAmount, [taxable, taxAmount]);

  const due = useMemo(() => Math.max(total - (Number(paidAmount) || 0), 0), [total, paidAmount]);

  const addItem = () => {
    setExtraItems((prev) => [
      ...prev,
      { id: Date.now(), label: "", amount: 0 }
    ]);
  };

  const updateItem = (id, patch) => {
    setExtraItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const removeItem = (id) => {
    setExtraItems((prev) => prev.filter((i) => i.id !== id));
  };

  const resetAll = () => {
    setDoctorId(1);
    setSessions(1);
    setExtraItems([]);
    setDiscountPct(0);
    setTaxPct(5);
    setPaidAmount(0);
  };

  return (
    <div className="billing-page">
      <div className="container">
        <h1 className="section-title">Billing Calculator</h1>

        <div className="billing-grid">
          <div className="card">
            <h2 className="section-heading">Appointment</h2>
            <div className="form-group">
              <label className="form-label">Doctor</label>
              <select
                className="form-input"
                value={doctorId}
                onChange={(e) => setDoctorId(Number(e.target.value))}
              >
                {DOCTORS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.specialty} ({currency(d.fee)}/session)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Number of Sessions</label>
              <input
                type="number"
                min={1}
                className="form-input"
                value={sessions}
                onChange={(e) => setSessions(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <div className="summary-line">
              <span>Consultation Subtotal</span>
              <strong>{currency(consultSubtotal)}</strong>
            </div>
          </div>

          <div className="card">
            <h2 className="section-heading">Extras</h2>
            <div className="extras">
              {extraItems.length === 0 && (
                <p className="muted">No extra items yet.</p>
              )}
              {extraItems.map((item) => (
                <div key={item.id} className="extra-row">
                  <input
                    className="form-input"
                    placeholder="Item (e.g., Lab Tests)"
                    value={item.label}
                    onChange={(e) => updateItem(item.id, { label: e.target.value })}
                  />
                  <input
                    className="form-input amount"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(e) => updateItem(item.id, { amount: Number(e.target.value) })}
                  />
                  <button className="btn secondary-btn small" onClick={() => removeItem(item.id)}>Remove</button>
                </div>
              ))}
              <button className="btn primary-btn" onClick={addItem}>Add Item</button>
              <div className="summary-line">
                <span>Extras Subtotal</span>
                <strong>{currency(itemsSubtotal)}</strong>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="section-heading">Summary</h2>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Discount (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="form-input"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tax (%)</label>
                <input
                  type="number"
                  min={0}
                  className="form-input"
                  value={taxPct}
                  onChange={(e) => setTaxPct(Math.max(0, Number(e.target.value)))}
                />
              </div>
            </div>

            <div className="calc-lines">
              <div className="summary-line"><span>Subtotal</span><strong>{currency(subtotal)}</strong></div>
              <div className="summary-line"><span>Discount</span><strong>- {currency(discountAmount)}</strong></div>
              <div className="summary-line"><span>Tax</span><strong>{currency(taxAmount)}</strong></div>
              <div className="summary-line total"><span>Total Payable</span><strong>{currency(total)}</strong></div>
            </div>

            <div className="form-group">
              <label className="form-label">Amount Paid</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="form-input"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
              />
            </div>
            <div className="summary-line due"><span>Amount Due</span><strong>{currency(due)}</strong></div>

            <div className="actions">
              <button className="btn secondary-btn" onClick={resetAll}>Reset</button>
              <a className="btn primary-btn" href="#" onClick={(e)=>e.preventDefault()}>Proceed to Payment</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingCalculator;
