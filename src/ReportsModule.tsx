
import { useEffect, useState } from 'react'
import { db } from './db'
import './ReportsModule.css'

export default function ReportsModule() {
  const [stats, setStats] = useState({
    patients: 0,
    appointments: 0,
    scheduled: 0,
    completedAppointments: 0,
    medicines: 0,
    lowStock: 0,
    visits: 0,
    completedVisits: 0,
    followUps: 0,
    referrals: 0,
    pendingReferrals: 0,
    acceptedReferrals: 0,
    completedReferrals: 0,
  })

  useEffect(() => {
    async function loadReports() {
      const [
        patients,
        appointments,
        medicines,
        visits,
        referrals,
      ] = await Promise.all([
        db.patients.toArray(),
        db.appointments.toArray(),
        db.medicines.toArray(),
        db.fieldVisits.toArray(),
        db.referrals.toArray(),
      ])

      setStats({
        patients: patients.length,
        appointments: appointments.length,
        scheduled: appointments.filter(a => a.status === 'Scheduled').length,
        completedAppointments: appointments.filter(a => a.status === 'Completed').length,
        medicines: medicines.length,
        lowStock: medicines.filter(m => m.quantity <= m.minimumStock).length,
        visits: visits.length,
        completedVisits: visits.filter(v => v.status === 'Completed').length,
        followUps: visits.filter(v => v.status === 'Follow-up Required').length,
        referrals: referrals.length,
        pendingReferrals: referrals.filter(r => r.status === 'Pending').length,
        acceptedReferrals: referrals.filter(r => r.status === 'Accepted').length,
        completedReferrals: referrals.filter(r => r.status === 'Completed').length,
      })
    }

    loadReports()
  }, [])

  const getPercentage = (value: number, total: number) =>
    total === 0 ? 0 : Math.round((value / total) * 100)

  return (
    <div className="reports-page">
      <h1>Reports & Analytics</h1>
      <p>Overview of Rural HealthTrack activities and statistics.</p>

      <div className="report-cards">
        <div className="report-card">
          <h3>Total Patients</h3>
          <strong>{stats.patients}</strong>
        </div>

        <div className="report-card">
          <h3>Total Appointments</h3>
          <strong>{stats.appointments}</strong>
        </div>

        <div className="report-card">
          <h3>Medicine Items</h3>
          <strong>{stats.medicines}</strong>
        </div>

        <div className="report-card">
          <h3>Total Field Visits</h3>
          <strong>{stats.visits}</strong>
        </div>

        <div className="report-card">
          <h3>Total Referrals</h3>
          <strong>{stats.referrals}</strong>
        </div>

        <div className="report-card">
          <h3>Low Stock Medicines</h3>
          <strong>{stats.lowStock}</strong>
        </div>
      </div>

      <div className="report-panels">
        <section className="report-panel">
          <h2>Appointment Analysis</h2>
          <p>Scheduled: {stats.scheduled}</p>
          <div className="report-bar">
            <div style={{ width: `${getPercentage(stats.scheduled, stats.appointments)}%` }} />
          </div>

          <p>Completed: {stats.completedAppointments}</p>
          <div className="report-bar completed">
            <div style={{ width: `${getPercentage(stats.completedAppointments, stats.appointments)}%` }} />
          </div>
        </section>

        <section className="report-panel">
          <h2>Field Visit Analysis</h2>
          <p>Completed Visits: {stats.completedVisits}</p>
          <div className="report-bar completed">
            <div style={{ width: `${getPercentage(stats.completedVisits, stats.visits)}%` }} />
          </div>

          <p>Follow-ups Required: {stats.followUps}</p>
          <div className="report-bar warning">
            <div style={{ width: `${getPercentage(stats.followUps, stats.visits)}%` }} />
          </div>
        </section>

        <section className="report-panel">
          <h2>Referral Analysis</h2>
          <p>Pending: {stats.pendingReferrals}</p>
          <div className="report-bar warning">
            <div style={{ width: `${getPercentage(stats.pendingReferrals, stats.referrals)}%` }} />
          </div>

          <p>Accepted: {stats.acceptedReferrals}</p>
          <div className="report-bar">
            <div style={{ width: `${getPercentage(stats.acceptedReferrals, stats.referrals)}%` }} />
          </div>

          <p>Completed: {stats.completedReferrals}</p>
          <div className="report-bar completed">
            <div style={{ width: `${getPercentage(stats.completedReferrals, stats.referrals)}%` }} />
          </div>
        </section>
      </div>

      <div className="report-note">
        <strong>Note:</strong> These reports show activity totals from the
        records saved in this browser. They are summaries, not clinical
        assessments.
      </div>
    </div>
  )
}
