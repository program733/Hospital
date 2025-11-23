import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [okMessage, setOkMessage] = useState(null);
  const [patients, setPatients] = useState([]);

  // form state
  const [patientId, setPatientId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  // Payment tracking
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentHistory, setPaymentHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [billRes, patRes] = await Promise.all([
          api.get("/bills/"),
          api.get("/patients/"),
        ]);
        const billsData = Array.isArray(billRes.data) ? billRes.data : [];
        setBills(billsData);
        setFiltered(billsData);
        setPatients(Array.isArray(patRes.data) ? patRes.data : []);
      } catch (err) {
        setError(err.message || "Failed to load bills");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!query) {
      setFiltered(bills);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      bills.filter(
        (b) =>
          String(b.id).includes(q) ||
          (b.patient_id && String(b.patient_id).includes(q)) ||
          (b.status && b.status.toLowerCase().includes(q)) ||
          (b.amount && String(b.amount).includes(q))
      )
    );
  }, [query, bills]);

  const resetForm = () => {
    setPatientId("");
    setIssueDate("");
    setDueDate("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setOkMessage(null);

    if (!patientId || !issueDate || !dueDate) {
      setError("Please fill all required fields");
      return;
    }

    const payload = {
      patient_id: parseInt(patientId, 10),
      issue_date: new Date(issueDate).toISOString(),
      due_date: new Date(dueDate).toISOString(),
      status: "Pending",
    };

    try {
      setSubmitting(true);
      const res = await api.post("/bills/", payload);
      const created = res.data;
      setBills((prev) => [created, ...prev]);
      setFiltered((prev) => [created, ...prev]);
      resetForm();
      setOkMessage("✓ Bill generated");
      setTimeout(() => setOkMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to create bill");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedBill || !paidAmount || !paymentMethod) {
      setError("Please enter payment amount and method");
      return;
    }

    const paid = parseFloat(paidAmount);
    if (paid <= 0) {
      setError("Payment amount must be greater than 0");
      return;
    }

    try {
      const payload = {
        bill_id: selectedBill.id,
        amount: Math.round(paid),
        payment_method: paymentMethod,
        notes: paymentNotes || null,
      };

      await api.post("/payments/", payload);

      // Refresh bills
      const billRes = await api.get("/bills/");
      setBills(billRes.data);
      setFiltered(billRes.data);

      setShowPaymentModal(false);
      setSelectedBill(null);
      setPaidAmount("");
      setPaymentMethod("Cash");
      setPaymentNotes("");
      setOkMessage(`✓ Payment of $${paid} recorded`);
      setTimeout(() => setOkMessage(null), 3000);
    } catch (err) {
      setError("Failed to record payment");
    }
  };

  const showPaymentHistoryModal = async (bill) => {
    try {
      const res = await api.get(`/payments/bill/${bill.id}`);
      setPaymentHistory(res.data);
      setSelectedBill(bill);
      setShowHistoryModal(true);
    } catch (err) {
      setError("Failed to load payment history");
    }
  };

  const getPatientName = (id) => {
    const p = patients.find((pat) => pat.id === id);
    return p ? p.name : `Patient ${id}`;
  };

  const handlePrint = (bill) => {
    const printWindow = window.open("", "_blank");
    const patientName = getPatientName(bill.patient_id);
    const paidAmt = bill.paid_amount || 0;
    const pending = bill.amount - paidAmt;

    // Fetch payment history for this bill
    api.get(`/payments/bill/${bill.id}`).then(res => {
      const payments = res.data;

      let paymentsHTML = '';
      if (payments.length > 0) {
        paymentsHTML = `
          <h3>Payment History</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(p => `
                <tr>
                  <td>${new Date(p.payment_date).toLocaleString()}</td>
                  <td>$${p.amount}</td>
                  <td>${p.payment_method}</td>
                  <td>${p.notes || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Bill #${bill.id}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .bill-info { margin-bottom: 20px; }
              .bill-info p { margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #f0f0f0; }
              .total { font-weight: bold; font-size: 1.2em; text-align: right; margin-top: 20px; }
              .footer { margin-top: 50px; text-align: center; font-size: 0.8em; color: #666; }
              h3 { color: #007bff; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Janta Hospital</h1>
              <p>Jarangdih Phusro, Bokaro</p>
              <h2>Patient Bill</h2>
            </div>
            <div class="bill-info">
              <p><strong>Bill ID:</strong> ${bill.id}</p>
              <p><strong>Patient:</strong> ${patientName} (ID: ${bill.patient_id})</p>
              <p><strong>Issue Date:</strong> ${new Date(bill.issue_date).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${new Date(bill.due_date).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span style="color: ${bill.status === 'Paid' ? 'green' : 'red'}">${bill.status}</span></p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Medical Services & Medicines (Consolidated)</td>
                  <td>$${bill.amount}</td>
                </tr>
              </tbody>
            </table>
            <div class="total">
              Total Amount: $${bill.amount}<br>
              Paid: $${paidAmt}<br>
              <span style="color: ${pending > 0 ? 'red' : 'green'}">Pending: $${pending}</span>
            </div>
            ${paymentsHTML}
            <div class="footer">
              <p>This is a computer-generated bill and does not require a signature.</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    });
  };

  return (
    <div className="page bills-page">
       <header className="hero" style={{ padding: '5px 10px' }}>
         <div>
           <h3 style={{ margin: 0, fontSize: '1.2em' }}>💰 Bills</h3>
           <p className="hero-sub" style={{ margin: '2px 0 0', fontSize: '0.85em' }}>Create and manage patient billing</p>
         </div>
       </header>

      <div className="content-grid">
        <aside className="card form-card">
          <h3>Generate Bill</h3>
          <form onSubmit={handleSubmit} className="bill-form">
            <label className="full-width">
              Patient
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
                <option value="">Select Patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (ID: {p.id})
                  </option>
                ))}
              </select>
              <small className="help-text">Bill will be auto-calculated from prescriptions</small>
            </label>

            <label>
              Issue Date
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </label>

            <label>
              Due Date
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </label>

            <div className="form-actions full-width">
              <button className="btn primary" type="submit" disabled={submitting}>
                {submitting ? "Generating..." : "Generate Bill"}
              </button>
              <button className="btn" type="button" onClick={resetForm} disabled={submitting}>
                Reset
              </button>
            </div>

            {error && <div className="alert error compact">{error}</div>}
            {okMessage && <div className="alert success compact">{okMessage}</div>}
          </form>
        </aside>

        <section className="card list-card">
          <div className="list-header">
            <h3>Bill List</h3>
            <div>
              <input
                className="search"
                placeholder="Search by ID, patient, amount or status..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="center">Loading bills...</div>
          ) : filtered.length === 0 ? (
            <div className="center muted">No bills found.</div>
          ) : (
            <div className="table-wrap">
              <table className="striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Pending</th>
                    <th>Status</th>
                    <th>Issue Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => {
                    const paidAmt = b.paid_amount || 0;
                    const pending = b.amount - paidAmt;
                    return (
                      <tr key={b.id}>
                        <td className="mono">{b.id}</td>
                        <td>{getPatientName(b.patient_id)}</td>
                        <td>${b.amount ?? "—"}</td>
                        <td>${paidAmt}</td>
                        <td className={pending > 0 ? "text-danger" : "text-success"}>${pending}</td>
                        <td>
                          <span className={`badge ${b.status === 'Paid' ? 'success' : b.status === 'Partial' ? 'warning' : 'danger'}`}>
                            {b.status ?? "—"}
                          </span>
                        </td>
                        <td>{b.issue_date ? new Date(b.issue_date).toLocaleDateString() : "—"}</td>
                        <td>
                          <button
                            className="btn small secondary"
                            onClick={() => {
                              setSelectedBill(b);
                              setShowPaymentModal(true);
                            }}
                            disabled={b.status === 'Paid'}
                          >
                            💳 Pay
                          </button>
                          <button
                            className="btn small secondary"
                            onClick={() => showPaymentHistoryModal(b)}
                          >
                            📜 History
                          </button>
                          <button className="btn small secondary" onClick={() => handlePrint(b)}>
                            🖨 Print
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Payment - Bill #{selectedBill.id}</h3>
              <button className="close-btn" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>Patient:</strong> {getPatientName(selectedBill.patient_id)}</p>
              <p><strong>Total Amount:</strong> ${selectedBill.amount}</p>
              <p><strong>Already Paid:</strong> ${selectedBill.paid_amount || 0}</p>
              <p><strong>Pending:</strong> <span className="text-danger">${selectedBill.amount - (selectedBill.paid_amount || 0)}</span></p>

              <label>
                Payment Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="Enter amount"
                  autoFocus
                />
              </label>

              <label>
                Payment Method
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="PhonePay">PhonePay</option>
                  <option value="GPay">GPay</option>
                  <option value="Paytm">Paytm</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </label>

              <label>
                Notes (Optional)
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g., Transaction ID, Reference"
                />
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button className="btn primary" onClick={handlePayment}>Record Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistoryModal && selectedBill && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Payment History - Bill #{selectedBill.id}</h3>
              <button className="close-btn" onClick={() => setShowHistoryModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>Patient:</strong> {getPatientName(selectedBill.patient_id)}</p>
              <p><strong>Total Amount:</strong> ${selectedBill.amount}</p>
              <p><strong>Total Paid:</strong> ${selectedBill.paid_amount || 0}</p>
              <p><strong>Pending:</strong> <span className={selectedBill.amount - (selectedBill.paid_amount || 0) > 0 ? "text-danger" : "text-success"}>${selectedBill.amount - (selectedBill.paid_amount || 0)}</span></p>

              {paymentHistory.length === 0 ? (
                <p className="center muted">No payments recorded yet</p>
              ) : (
                <div className="table-wrap">
                  <table className="striped">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((payment) => (
                        <tr key={payment.id}>
                          <td>{new Date(payment.payment_date).toLocaleString()}</td>
                          <td>${payment.amount}</td>
                          <td><span className="badge success">{payment.payment_method}</span></td>
                          <td>{payment.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowHistoryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
