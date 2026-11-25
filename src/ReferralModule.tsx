
import { useEffect, useState } from 'react'
import { db, type Referral, type Patient } from './db'
import './ReferralModule.css'

export default function ReferralModule() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientId, setPatientId] = useState('')
  const [facility, setFacility] = useState('')
  const [reason, setReason] = useState('')
  const [referralDate, setReferralDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [message, setMessage] = useState('')

  async function loadData() {
    const referralData = await db.referrals.toArray()
    const patientData = await db.patients.toArray()
    setReferrals(referralData)
    setPatients(patientData)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function addReferral(e: React.FormEvent) {
    e.preventDefault()

    if (!patientId || !facility.trim() || !reason.trim()) {
      setMessage('Please complete all required fields.')
      return
    }

    await db.referrals.add({
      patientId,
      facility: facility.trim(),
      reason: reason.trim(),
      referralDate,
      status: 'Pending',
    })

    setPatientId('')
    setFacility('')
    setReason('')
    setMessage('Referral saved successfully!')
    await loadData()
  }

  async function updateStatus(id: number, status: Referral['status']) {
    await db.referrals.update(id, { status })
    await loadData()
  }

  const pending = referrals.filter(r => r.status === 'Pending').length
  const accepted = referrals.filter(r => r.status === 'Accepted').length
  const completed = referrals.filter(r => r.status === 'Completed').length

  return (
    <div className="referral-page">
      <h1>Referral Management</h1>
      <p>Register and track patient referrals.</p>

      <div className="referral-stats">
        <div className="referral-card">
          <h3>Total Referrals</h3>
          <strong>{referrals.length}</strong>
        </div>
        <div className="referral-card">
          <h3>Pending</h3>
          <strong>{pending}</strong>
        </div>
        <div className="referral-card">
          <h3>Accepted</h3>
          <strong>{accepted}</strong>
        </div>
        <div className="referral-card">
          <h3>Completed</h3>
          <strong>{completed}</strong>
        </div>
      </div>

      <div className="referral-panel">
        <h2>Register New Referral</h2>

        <form onSubmit={addReferral}>
          <label>Patient</label>
          <select
            value={patientId}
            onChange={e => setPatientId(e.target.value)}
          >
            <option value="">Select patient</option>
            {patients.map(p => (
              <option key={p.id} value={p.patientId}>
                {p.name} ({p.patientId})
              </option>
            ))}
          </select>

          <label>Healthcare Facility</label>
          <input
            value={facility}
            onChange={e => setFacility(e.target.value)}
            placeholder="Enter hospital or clinic name"
          />

          <label>Referral Reason</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Enter referral reason"
          />

          <label>Referral Date</label>
          <input
            type="date"
            value={referralDate}
            onChange={e => setReferralDate(e.target.value)}
          />

          <button type="submit">Save Referral</button>
        </form>

        {message && <p className="referral-message">{message}</p>}
      </div>

      <div className="referral-panel">
        <h2>Referral History</h2>

        {referrals.length === 0 ? (
          <p>No referrals recorded yet.</p>
        ) : (
          <div className="referral-list">
            {referrals.map(r => {
              const patient = patients.find(
                p => p.patientId === r.patientId
              )

              return (
                <div className="referral-item" key={r.id}>
                  <h3>{patient?.name || r.patientId}</h3>
                  <p><strong>Facility:</strong> {r.facility}</p>
                  <p><strong>Reason:</strong> {r.reason}</p>
                  <p><strong>Date:</strong> {r.referralDate}</p>
                  <p><strong>Status:</strong> {r.status}</p>

                  <label>Update Status</label>
                  <select
                    value={r.status}
                    onChange={e =>
                      updateStatus(
                        r.id!,
                        e.target.value as Referral['status']
                      )
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
