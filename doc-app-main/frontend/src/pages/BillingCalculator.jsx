import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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

  const getSpecialtyLabel = (spec) => {
    switch (spec) {
      case "General Physician": return t('specialty.general');
      case "Gynecologist": return t('specialty.gynecologist');
      case "Dermatologist": return t('specialty.dermatologist');
      case "Cardiologist": return t('specialty.cardiologist');
      case "Pediatrician": return t('specialty.pediatrician');
      default: return spec;
    }
  };

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
        <h1 className="section-title">{t('billing.title')}</h1>

        <div className="billing-grid">
          <div className="card">
            <h2 className="section-heading">{t('billing.appointment')}</h2>
            <div className="form-group">
              <label className="form-label">{t('billing.doctor')}</label>
              <select
                className="form-input"
                value={doctorId}
                onChange={(e) => setDoctorId(Number(e.target.value))}
              >
                {DOCTORS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {getSpecialtyLabel(d.specialty)} ({currency(d.fee)}/{t('common.share') === 'பகிர்' ? 'சந்திப்பு' : 'session'})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('billing.sessions')}</label>
              <input
                type="number"
                min={1}
                className="form-input"
                value={sessions}
                onChange={(e) => setSessions(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <div className="summary-line">
              <span>{t('billing.consultSubtotal')}</span>
              <strong>{currency(consultSubtotal)}</strong>
            </div>
          </div>

          <div className="card">
            <h2 className="section-heading">{t('billing.extras')}</h2>
            <div className="extras">
              {extraItems.length === 0 && (
                <p className="muted">{t('billing.noExtras')}</p>
              )}
              {extraItems.map((item) => (
                <div key={item.id} className="extra-row">
                  <input
                    className="form-input"
                    placeholder={t('billing.itemPlaceholder')}
                    value={item.label}
                    onChange={(e) => updateItem(item.id, { label: e.target.value })}
                  />
                  <input
                    className="form-input amount"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder={t('billing.amountPlaceholder')}
                    value={item.amount}
                    onChange={(e) => updateItem(item.id, { amount: Number(e.target.value) })}
                  />
                  <button className="btn secondary-btn small" onClick={() => removeItem(item.id)}>{t('billing.remove')}</button>
                </div>
              ))}
              <button className="btn primary-btn" onClick={addItem}>{t('billing.addItem')}</button>
              <div className="summary-line">
                <span>{t('billing.extrasSubtotal')}</span>
                <strong>{currency(itemsSubtotal)}</strong>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="section-heading">{t('billing.summary')}</h2>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('billing.discount')}</label>
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
                <label className="form-label">{t('billing.tax')}</label>
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
              <div className="summary-line"><span>{t('billing.subtotal')}</span><strong>{currency(subtotal)}</strong></div>
              <div className="summary-line"><span>{t('billing.discount') === 'தள்ளுபடி (%)' ? 'தள்ளுபடி' : 'Discount'}</span><strong>- {currency(discountAmount)}</strong></div>
              <div className="summary-line"><span>{t('billing.tax') === 'வரி (%)' ? 'வரி' : 'Tax'}</span><strong>{currency(taxAmount)}</strong></div>
              <div className="summary-line total"><span>{t('billing.totalPayable')}</span><strong>{currency(total)}</strong></div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('billing.paidAmount')}</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="form-input"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
              />
            </div>
            <div className="summary-line due"><span>{t('billing.dueAmount')}</span><strong>{currency(due)}</strong></div>

            <div className="actions">
              <button className="btn secondary-btn" onClick={resetAll}>{t('billing.reset')}</button>
              <a className="btn primary-btn" href="#" onClick={(e)=>e.preventDefault()}>{t('billing.proceedPayment')}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingCalculator;
