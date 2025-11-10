import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [okMessage, setOkMessage] = useState(null);

  // form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [manufactureDate, setManufactureDate] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [category, setCategory] = useState("");
  const [supplier, setSupplier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBatch, setFilterBatch] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get("/medicines")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setMedicines(data);
        setFiltered(data);
      })
      .catch((err) => setError(err.message || "Failed to load medicines"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let filtered = medicines;

    // Apply search query
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          (m.category && m.category.toLowerCase().includes(q)) ||
          (m.batch_number && m.batch_number.toLowerCase().includes(q)) ||
          (m.supplier && m.supplier.toLowerCase().includes(q)) ||
          String(m.id).includes(q)
      );
    }

    // Apply category filter
    if (filterCategory) {
      filtered = filtered.filter((m) => m.category === filterCategory);
    }

    // Apply batch filter
    if (filterBatch) {
      filtered = filtered.filter((m) => m.batch_number === filterBatch);
    }

    setFiltered(filtered);
  }, [query, medicines, filterCategory, filterBatch]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setStock("");
    setPrice("");
    setExpiryDate("");
    setBatchNumber("");
    setManufactureDate("");
    setLowStockThreshold("10");
    setCategory("");
    setSupplier("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setOkMessage(null);

    if (!name.trim() || !stock || !price || !expiryDate || !batchNumber.trim() || !manufactureDate || !category.trim() || !supplier.trim()) {
      setError("All fields are required.");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      stock: parseInt(stock, 10),
      price: parseInt(price, 10),
      expiry_date: new Date(expiryDate).toISOString(),
      batch_number: batchNumber.trim(),
      manufacture_date: new Date(manufactureDate).toISOString(),
      low_stock_threshold: parseInt(lowStockThreshold, 10),
      category: category.trim(),
      supplier: supplier.trim(),
    };

    try {
      setSubmitting(true);
      const res = await api.post("/medicines", payload);
      const created = res.data;
      setMedicines((prev) => [created, ...prev]);
      setFiltered((prev) => [created, ...prev]);
      resetForm();
      setOkMessage("Medicine added successfully.");
      setTimeout(() => setOkMessage(null), 3500);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to add medicine");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page medicines-page">
      <header className="hero">
        <div>
          <h1>💊 Hospital Management — Medicines</h1>
          <p className="hero-sub">Manage medicine inventory and stock levels</p>
        </div>
      </header>

      <div className="content-grid">
        <aside className="card alerts-card">
          <h3>⚠️ Inventory Alerts</h3>
          <div className="alerts-section">
            <div className="alert low-stock-alert">
              <strong>Low Stock Items:</strong> Medicines below threshold
            </div>
            <div className="alert expiring-alert">
              <strong>Expiring Soon:</strong> Medicines expiring within 30 days
            </div>
          </div>
        </aside>

        <aside className="card form-card">
          <h3>Add Medicine</h3>
          <form onSubmit={handleSubmit} className="medicine-form">
            <label>
              Name <span className="muted">*</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Medicine name" />
            </label>

            <label>
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description or usage"
                rows="3"
              />
            </label>

            <div className="row">
              <label>
                Stock <span className="muted">*</span>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="e.g. 100"
                />
              </label>

              <label>
                Price <span className="muted">*</span>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 50"
                />
              </label>
            </div>

            <label>
              Expiry Date <span className="muted">*</span>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </label>

            <div className="row">
              <label>
                Batch Number <span className="muted">*</span>
                <input
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. BATCH-2024-001"
                />
              </label>

              <label>
                Manufacture Date <span className="muted">*</span>
                <input
                  type="date"
                  value={manufactureDate}
                  onChange={(e) => setManufactureDate(e.target.value)}
                />
              </label>
            </div>

            <div className="row">
              <label>
                Low Stock Threshold
                <input
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  placeholder="e.g. 10"
                />
              </label>

              <label>
                Category <span className="muted">*</span>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Antibiotics"
                />
              </label>
            </div>

            <label>
              Supplier <span className="muted">*</span>
              <input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. PharmaCorp Ltd."
              />
            </label>

            <div className="form-actions">
              <button className="btn primary" type="submit" disabled={submitting}>
                {submitting ? "Adding..." : "Add Medicine"}
              </button>
              <button className="btn" type="button" onClick={resetForm} disabled={submitting}>
                Reset
              </button>
            </div>

            {error && <div className="alert error">{error}</div>}
            {okMessage && <div className="alert success">{okMessage}</div>}
            <p className="footnote">Required fields marked with *</p>
          </form>
        </aside>

        <section className="card list-card">
          <div className="list-header">
            <h3>Medicine Inventory</h3>
            <div className="filters">
              <input
                className="search"
                placeholder="Search by name, description, category, batch, supplier or ID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                {[...new Set(medicines.map(m => m.category).filter(Boolean))].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}>
                <option value="">All Batches</option>
                {[...new Set(medicines.map(m => m.batch_number).filter(Boolean))].map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="center">Loading medicines...</div>
          ) : filtered.length === 0 ? (
            <div className="center muted">No medicines found.</div>
          ) : (
            <div className="table-wrap">
              <table className="striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Batch</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Expiry Date</th>
                    <th>Supplier</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const isLowStock = m.stock <= m.low_stock_threshold;
                    const isExpiringSoon = m.expiry_date && new Date(m.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    const rowClass = isLowStock || isExpiringSoon ? "alert-row" : "";

                    return (
                      <tr key={m.id} className={rowClass}>
                        <td className="mono">{m.id}</td>
                        <td>{m.name}</td>
                        <td>{m.category ?? "—"}</td>
                        <td>{m.batch_number ?? "—"}</td>
                        <td className={isLowStock ? "low-stock" : ""}>{m.stock ?? "—"}</td>
                        <td>${m.price ?? "—"}</td>
                        <td className={isExpiringSoon ? "expiring-soon" : ""}>
                          {m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : "—"}
                        </td>
                        <td>{m.supplier ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
