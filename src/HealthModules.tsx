
import { useEffect, useState } from 'react'
import {
  db,
  type Patient,
  type MedicalRecord,
  type VitalRecord,
  type HealthWorker
} from './db'
import './HealthModules.css'

type Section = 'medical' | 'workers'

export default function HealthModules() {
  const [section, setSection] = useState<Section>('medical')
  const [patients, setPatients] = useState<Patient[]>([])
  const [workers, setWorkers] = useState<HealthWorker[]>([])
  const [patientId, setPatientId] = useState('')
  const [notes, setNotes] = useState('')
  const [recordDate, setRecordDate] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const [bp, setBp] = useState('')
  const [temperature, setTemperature] = useState('')
  const [pulse, setPulse] = useState('')
  const [spo2, setSpo2] = useState('')
  const [weight, setWeight] = useState('')

  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [vitals, setVitals] = useState<VitalRecord[]>([])

  const [workerForm, setWorkerForm] = useState({
    name: '',
    phone: '',
    village: '',
    role: 'Community Health Worker'
  })

  const [workerSearch, setWorkerSearch] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadPatients()
    loadWorkers()
  }, [])

  async function loadPatients() {
    setPatients(await db.patients.toArray())
  }

  async function loadWorkers() {
    setWorkers(await db.healthWorkers.toArray())
  }

  async function loadHistory(id: string) {
    setPatientId(id)

    if (!id) {
      setRecords([])
      setVitals([])
      return
    }

    const medical = await db.medicalRecords
      .where('patientId').equals(id).toArray()

    const health = await db.vitals
      .where('patientId').equals(id).toArray()

    setRecords(medical.sort((a, b) => b.date.localeCompare(a.date)))
    setVitals(health.sort((a, b) => b.date.localeCompare(a.date)))
  }

  async function saveMedicalRecord() {
    if (!patientId || !notes.trim()) {
      setMessage('Select a patient and enter medical notes.')
      return
    }

    await db.medicalRecords.add({
      patientId,
      date: recordDate,
      notes: notes.trim(),
      recordedBy: 'Clinic Staff',
      syncStatus: 'pending'
    })

    setNotes('')
    await loadHistory(patientId)
    setMessage('Medical record saved successfully.')
  }

  async function saveVitals() {
    if (!patientId || !bp.trim() ||
      !temperature.trim() || !pulse.trim() ||
      !spo2.trim() || !weight.trim()) {
      setMessage('Complete all measurement fields.')
      return
    }

    const temp = Number(temperature)
    const pulseValue = Number(pulse)
    const spo2Value = Number(spo2)
    const weightValue = Number(weight)

    if (
      !Number.isFinite(temp) || temp <= 0 || temp > 50 ||
      !Number.isInteger(pulseValue) || pulseValue <= 0 ||
      !Number.isInteger(spo2Value) || spo2Value <= 0 ||
      spo2Value > 100 ||
      !Number.isFinite(weightValue) || weightValue <= 0
    ) {
      setMessage('Enter valid measurement values.')
      return
    }

    await db.vitals.add({
      patientId,
      date: recordDate,
      bloodPressure: bp.trim(),
      temperature: temp,
      pulse: pulseValue,
      spo2: spo2Value,
      weight: weightValue,
      recordedBy: 'Clinic Staff',
      syncStatus: 'pending'
    })

    setBp('')
    setTemperature('')
    setPulse('')
    setSpo2('')
    setWeight('')

    await loadHistory(patientId)
    setMessage('Measurements saved successfully.')
  }

  async function addWorker(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const worker: HealthWorker = {
        workerId: `HWT-${Date.now()}`,
        name: workerForm.name.trim(),
        phone: workerForm.phone.trim(),
        village: workerForm.village.trim(),
        role: workerForm.role
      }

      await db.healthWorkers.add(worker)
      await loadWorkers()

      setWorkerForm({
        name: '',
        phone: '',
        village: '',
        role: 'Community Health Worker'
      })

      setMessage('Health worker registered successfully.')
    } catch {
      setMessage('Unable to register worker.')
    }
  }

  async function deleteWorker(id: number) {
    const confirmed = window.confirm(
      'Delete this health worker?'
    )

    if (!confirmed) return

    await db.healthWorkers.delete(id)
    await loadWorkers()
    setMessage('Health worker deleted.')
  }

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(workerSearch.toLowerCase()) ||
    worker.workerId.toLowerCase().includes(workerSearch.toLowerCase()) ||
    worker.village.toLowerCase().includes(workerSearch.toLowerCase())
  )

  return (
    <div className="health-modules">

      <h1>Healthcare Management</h1>
      <p>Manage patient health records and community health workers.</p>

      <div className="health-tabs">
        <button
          className={section === 'medical' ? 'health-tab active' : 'health-tab'}
          onClick={() => setSection('medical')}
        >
          Medical Records
        </button>

        <button
          className={section === 'workers' ? 'health-tab active' : 'health-tab'}
          onClick={() => setSection('workers')}
        >
          Health Workers
        </button>
      </div>

      {message && (
        <div className="health-message" role="status">
          {message}
          <button onClick={() => setMessage('')}>×</button>
        </div>
      )}

      {section === 'medical' && (
        <>
          <div className="health-panel">
            <h2>Select Patient</h2>

            <select
              value={patientId}
              onChange={e => loadHistory(e.target.value)}
            >
              <option value="">Choose a registered patient</option>

              {patients.map(patient => (
                <option key={patient.patientId} value={patient.patientId}>
                  {patient.name} — {patient.patientId}
                </option>
              ))}
            </select>

            {patients.length === 0 && (
              <p>Register a patient before adding records.</p>
            )}
          </div>

          {patientId && (
            <>
              <div className="health-panel">
                <h2>Medical History / Clinical Notes</h2>

                <label>Record Date</label>
                <input
                  type="date"
                  value={recordDate}
                  onChange={e => setRecordDate(e.target.value)}
                />

                <label>Clinical Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Enter notes recorded by healthcare staff"
                />

                <button onClick={saveMedicalRecord}>
                  Save Medical Record
                </button>
              </div>

              <div className="health-panel">
                <h2>Health Measurements</h2>

                <label>Blood Pressure (mmHg)</label>
                <input
                  value={bp}
                  onChange={e => setBp(e.target.value)}
                  placeholder="Example: 120/80"
                />

                <label>Temperature (°C)</label>
                <input type="number" step="0.1"
                  value={temperature}
                  onChange={e => setTemperature(e.target.value)}
                />

                <label>Pulse (beats/min)</label>
                <input type="number"
                  value={pulse}
                  onChange={e => setPulse(e.target.value)}
                />

                <label>SpO₂ (%)</label>
                <input type="number"
                  value={spo2}
                  onChange={e => setSpo2(e.target.value)}
                />

                <label>Weight (kg)</label>
                <input type="number" step="0.1"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                />

                <button onClick={saveVitals}>
                  Save Measurements
                </button>
              </div>

              <div className="health-panel">
                <h2>Medical History</h2>

                {records.length === 0 ? (
                  <p>No medical records yet.</p>
                ) : records.map(record => (
                  <div className="history-item" key={record.id}>
                    <strong>{record.date}</strong>
                    <p>{record.notes}</p>
                  </div>
                ))}
              </div>

              <div className="health-panel">
                <h2>Measurement History</h2>

                {vitals.length === 0 ? (
                  <p>No measurements recorded yet.</p>
                ) : vitals.map(item => (
                  <div className="history-item" key={item.id}>
                    <strong>{item.date}</strong>
                    <p>Blood Pressure: {item.bloodPressure} mmHg</p>
                    <p>Temperature: {item.temperature} °C</p>
                    <p>Pulse: {item.pulse} bpm</p>
                    <p>SpO₂: {item.spo2}%</p>
                    <p>Weight: {item.weight} kg</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {section === 'workers' && (
        <>
          <div className="health-panel">
            <h2>Register Health Worker</h2>

            <form className="worker-form" onSubmit={addWorker}>
              <label>Full Name *</label>
              <input required value={workerForm.name}
                onChange={e => setWorkerForm({
                  ...workerForm, name: e.target.value
                })}
                placeholder="Enter worker name"
              />

              <label>Phone Number</label>
              <input type="tel" value={workerForm.phone}
                onChange={e => setWorkerForm({
                  ...workerForm, phone: e.target.value
                })}
                placeholder="Enter phone number"
              />

              <label>Village *</label>
              <input required value={workerForm.village}
                onChange={e => setWorkerForm({
                  ...workerForm, village: e.target.value
                })}
                placeholder="Enter village"
              />

              <label>Role</label>
              <select value={workerForm.role}
                onChange={e => setWorkerForm({
                  ...workerForm, role: e.target.value
                })}>
                <option>Community Health Worker</option>
                <option>ANM</option>
                <option>ASHA Worker</option>
                <option>Clinic Administrator</option>
                <option>Nurse</option>
              </select>

              <button type="submit">
                Register Health Worker
              </button>
            </form>
          </div>

          <div className="health-panel">
            <h2>Registered Health Workers ({workers.length})</h2>

            <input
              placeholder="Search by name, ID or village..."
              value={workerSearch}
              onChange={e => setWorkerSearch(e.target.value)}
            />

            {filteredWorkers.length === 0 ? (
              <p>No health workers found.</p>
            ) : (
              <div className="worker-list">
                {filteredWorkers.map(worker => (
                  <div className="worker-card" key={worker.id}>
                    <div>
                      <strong>{worker.name}</strong>
                      <p>Worker ID: {worker.workerId}</p>
                      <p>Village: {worker.village}</p>
                      <p>Phone: {worker.phone || 'Not provided'}</p>
                      <p>Role: {worker.role}</p>
                    </div>

                    <button
                      className="worker-delete"
                      onClick={() => worker.id !== undefined &&
                        deleteWorker(worker.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

    </div>
  )
}
