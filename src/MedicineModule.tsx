
import { useEffect, useState } from 'react'
import { db, type MedicineItem } from './db'
import './MedicineModule.css'

export default function MedicineModule() {
  const [medicines, setMedicines] = useState<MedicineItem[]>([])
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    name: '',
    quantity: '',
    unit: 'Tablets',
    expiryDate: '',
    minimumStock: ''
  })

  useEffect(() => {
    loadMedicines()
  }, [])

  async function loadMedicines() {
    const data = await db.medicines.toArray()
    setMedicines(data.sort((a, b) => a.name.localeCompare(b.name)))
  }

  async function addMedicine(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const quantity = Number(form.quantity)
    const minimumStock = Number(form.minimumStock)

    if (
      !form.name.trim() ||
      !form.expiryDate ||
      !Number.isFinite(quantity) ||
      quantity < 0 ||
      !Number.isInteger(quantity) ||
      !Number.isInteger(minimumStock) ||
      minimumStock < 0
    ) {
      setMessage('Please enter valid medicine details.')
      return
    }

    await db.medicines.add({
      name: form.name.trim(),
      quantity,
      unit: form.unit,
      expiryDate: form.expiryDate,
      minimumStock
    })

    setForm({
      name: '',
      quantity: '',
      unit: 'Tablets',
      expiryDate: '',
      minimumStock: ''
    })

    await loadMedicines()
    setMessage('Medicine added successfully.')
  }

  async function updateQuantity(id: number, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 0) {
      setMessage('Stock cannot be negative.')
      return
    }

    await db.medicines.update(id, { quantity })
    await loadMedicines()
    setMessage('Stock updated successfully.')
  }

  async function deleteMedicine(id: number) {
    if (!window.confirm('Delete this medicine record?')) return

    await db.medicines.delete(id)
    await loadMedicines()
    setMessage('Medicine deleted.')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayString = today.toISOString().slice(0, 10)

  const nearExpiryDate = new Date(today)
  nearExpiryDate.setDate(nearExpiryDate.getDate() + 30)
  const nearExpiryString = nearExpiryDate.toISOString().slice(0, 10)

  const lowStock = medicines.filter(
    medicine => medicine.quantity <= medicine.minimumStock
  )

  const expired = medicines.filter(
    medicine => medicine.expiryDate < todayString
  )

  const nearExpiry = medicines.filter(
    medicine =>
      medicine.expiryDate >= todayString &&
      medicine.expiryDate <= nearExpiryString
  )

  const filtered = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(search.toLowerCase())
  )

  function expiryStatus(date: string) {
    if (date < todayString) return 'Expired'
    if (date <= nearExpiryString) return 'Expiring Soon'
    return 'Valid'
  }

  return (
    <div className="medicine-page">
      <h1>Medicine Inventory</h1>
      <p>Monitor medicine stock and expiry information.</p>

      {message && (
        <div className="medicine-message">
          {message}
          <button onClick={() => setMessage('')}>×</button>
        </div>
      )}

      <div className="medicine-stats">
        <div className="medicine-stat">
          <h3>Total Medicines</h3>
          <strong>{medicines.length}</strong>
        </div>

        <div className="medicine-stat">
          <h3>Low Stock</h3>
          <strong>{lowStock.length}</strong>
        </div>

        <div className="medicine-stat">
          <h3>Expired</h3>
          <strong>{expired.length}</strong>
        </div>

        <div className="medicine-stat">
          <h3>Expiring Soon</h3>
          <strong>{nearExpiry.length}</strong>
        </div>
      </div>

      <div className="medicine-panel">
        <h2>Add Medicine</h2>

        <form onSubmit={addMedicine}>
          <label>Medicine Name *</label>
          <input
            required
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Enter medicine name"
          />

          <label>Available Quantity *</label>
          <input
            required
            type="number"
            min="0"
            step="1"
            value={form.quantity}
            onChange={e => setForm({ ...form, quantity: e.target.value })}
            placeholder="Enter quantity"
          />

          <label>Unit</label>
          <select
            value={form.unit}
            onChange={e => setForm({ ...form, unit: e.target.value })}
          >
            <option>Tablets</option>
            <option>Capsules</option>
            <option>Bottles</option>
            <option>Packets</option>
            <option>Vials</option>
            <option>Strips</option>
          </select>

          <label>Expiry Date *</label>
          <input
            required
            type="date"
            value={form.expiryDate}
            onChange={e => setForm({ ...form, expiryDate: e.target.value })}
          />

          <label>Minimum Stock Alert *</label>
          <input
            required
            type="number"
            min="0"
            step="1"
            value={form.minimumStock}
            onChange={e => setForm({ ...form, minimumStock: e.target.value })}
            placeholder="Enter minimum stock"
          />

          <button type="submit">Add Medicine</button>
        </form>
      </div>

      <div className="medicine-panel">
        <h2>Inventory Alerts</h2>

        <p>Low-stock medicines: {lowStock.length}</p>
        <p>Expired medicines: {expired.length}</p>
        <p>Medicines expiring within 30 days: {nearExpiry.length}</p>

        <p className="medicine-note">
          Expiry and stock alerts are reminders for authorized staff.
          They do not determine whether a medicine is suitable for use.
        </p>
      </div>

      <div className="medicine-panel">
        <h2>Medicine List</h2>

        <input
          placeholder="Search medicines..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="medicine-list">
          {filtered.map(medicine => (
            <div className="medicine-card" key={medicine.id}>
              <div>
                <h3>{medicine.name}</h3>
                <p>Stock: {medicine.quantity} {medicine.unit}</p>
                <p>Minimum Stock: {medicine.minimumStock}</p>
                <p>Expiry: {medicine.expiryDate}</p>

                <span className={
                  medicine.expiryDate < todayString
                    ? 'medicine-status expired'
                    : medicine.expiryDate <= nearExpiryString
                      ? 'medicine-status warning'
                      : 'medicine-status valid'
                }>
                  {expiryStatus(medicine.expiryDate)}
                </span>

                {medicine.quantity <= medicine.minimumStock && (
                  <span className="medicine-status warning">
                    Low Stock
                  </span>
                )}
              </div>

              <div className="medicine-actions">
                <button
                  onClick={() => medicine.id !== undefined &&
                    updateQuantity(medicine.id, medicine.quantity + 1)}
                >
                  +1 Stock
                </button>

                <button
                  onClick={() => medicine.id !== undefined &&
                    updateQuantity(medicine.id, medicine.quantity - 1)}
                  disabled={medicine.quantity === 0}
                >
                  -1 Stock
                </button>

                <button
                  className="medicine-delete"
                  onClick={() => medicine.id !== undefined &&
                    deleteMedicine(medicine.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && <p>No medicines found.</p>}
        </div>
      </div>
    </div>
  )
}
