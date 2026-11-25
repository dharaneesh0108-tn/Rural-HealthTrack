
import { useEffect, useState } from 'react'
import { db, type FieldVisit, type Patient, type HealthWorker } from './db'
import './FieldVisitModule.css'

export default function FieldVisitModule() {
  const [visits, setVisits] = useState<FieldVisit[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [workers, setWorkers] = useState<HealthWorker[]>([])
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    patientId: '',
    workerId: '',
    visitDate: new Date().toISOString().slice(0, 10),
    notes: '',
    followUpDate: '',
    status: 'Completed' as FieldVisit['status']
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [visitData, patientData, workerData] = await Promise.all([
      db.fieldVisits.toArray(),
      db.patients.toArray(),
      db.healthWorkers.toArray()
    ])

    setVisits(visitData.sort((a, b) =>
      b.visitDate.localeCompare(a.visitDate)
    ))
    setPatients(patientData)
    setWorkers(workerData)
  }

  async function saveVisit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.patientId || !form.workerId || !form.notes.trim()) {
      setMessage('Please complete all required fields.')
      return
    }

    if (
      form.status === 'Follow-up Required' &&
      !form.followUpDate
    ) {
      setMessage('Please enter a follow-up date.')
      return
    }

    if (
      form.followUpDate &&
      form.followUpDate < form.visitDate
    ) {
      setMessage('Follow-up date cannot be before the visit date.')
      return
    }

    await db.fieldVisits.add({
      patientId: form.patientId,
      workerId: form.workerId,
      visitDate: form.visitDate,
      notes: form.notes.trim(),
      followUpDate: form.followUpDate,
      status: form.status
    })

    setForm({
      patientId: '',
      workerId: '',
      visitDate: new Date().toISOString().slice(0, 10),
      notes: '',
      followUpDate: '',
      status: 'Completed'
    })

    await loadData()
    setMessage('Field visit saved successfully.')
  }

  const followUps = visits.filter(
    visit => visit.status === 'Follow-up Required'
  )

  function patientName(id: string) {
    return patients.find(p => p.patientId === id)?.name || 'Unknown patient'
  }

  function patientVillage(id: string) {
    return patients.find(p => p.patientId === id)?.village || 'Unknown village'
  }

  function workerName(id: string) {
    return workers.find(w => w.workerId === id)?.name || 'Unknown worker'
  }

  return (
    <div className="field-page">
      <h1>Field Visit Tracking</h1>
      <p>Manage community visits and patient follow-ups.</p>

      {message && (
        <div className="field-message">
          {message}
          <button onClick={() => setMessage('')}>×</button>
        </div>
      )}

      <div className="field-stats">
        <div>
          <h3>Total Visits</h3>
          <strong>{visits.length}</strong>
        </div>
        <div>
          <h3>Completed</h3>
          <strong>{visits.filter(v => v.status === 'Completed').length}</strong>
        </div>
        <div>
          <h3>Follow-ups</h3>
          <strong>{followUps.length}</strong>
        </div>
      </div>

      <div className="field-panel">
        <h2>Record a Field Visit</h2>

        <form onSubmit={saveVisit}>
          <label>Patient *</label>
          <select required value={form.patientId}
            onChange={e => setForm({ ...form, patientId: e.target.value })}>
            <option value="">Select patient</option>
            {patients.map(p => (
              <option key={p.patientId} value={p.patientId}>
                {p.name} — {p.village}
              </option>
            ))}
          </select>

          <label>Health Worker *</label>
          <select required value={form.workerId}
            onChange={e => setForm({ ...form, workerId: e.target.value })}>
            <option value="">Select health worker</option>
            {workers.map(w => (
              <option key={w.workerId} value={w.workerId}>
                {w.name} — {w.village}
              </option>
            ))}
          </select>

          <label>Visit Date *</label>
          <input required type="date" value={form.visitDate}
            onChange={e => setForm({ ...form, visitDate: e.target.value })} />

          <label>Visit Notes *</label>
          <textarea required value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Enter visit observations" />

          <label>Visit Status</label>
          <select value={form.status}
            onChange={e => setForm({
              ...form,
              status: e.target.value as FieldVisit['status']
            })}>
            <option value="Completed">Completed</option>
            <option value="Follow-up Required">Follow-up Required</option>
          </select>

          <label>Follow-up Date</label>
          <input type="date" min={form.visitDate}
            value={form.followUpDate}
            onChange={e => setForm({ ...form, followUpDate: e.target.value })} />

          <button type="submit">Save Field Visit</button>
        </form>
      </div>

      <div className="field-panel">
        <h2>Visit History</h2>

        {visits.length === 0 ? (
          <p>No field visits recorded yet.</p>
        ) : visits.map((visit, index) => (
          <div className="field-card" key={`${visit.patientId}-${visit.visitDate}-${index}`}>
            <h3>{patientName(visit.patientId)}</h3>
            <p>Village: {patientVillage(visit.patientId)}</p>
            <p>Health Worker: {workerName(visit.workerId)}</p>
            <p>Visit Date: {visit.visitDate}</p>
            <p>Notes: {visit.notes}</p>
            <p>Follow-up: {visit.followUpDate || 'Not scheduled'}</p>
            <span>{visit.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
