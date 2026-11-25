
import { useEffect, useMemo, useState } from 'react'
import { db, type Patient, type Appointment } from './db'
import HealthModules from './HealthModules'
import MedicineModule from './MedicineModule'
import FieldVisitModule from './FieldVisitModule'
import ReferralModule from './ReferralModule'
import ReportsModule from './ReportsModule'
import './App.css'

type Tab =
  | 'overview'
  | 'patients'
  | 'appointments'
  | 'health'
  | 'medicine'
  | 'fieldVisits'
  | 'referrals'
  | 'reports'

function App() {
  const [tab, setTab] = useState<Tab>('overview')
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [search, setSearch] = useState('')
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [message, setMessage] = useState('')

  const [patientForm, setPatientForm] = useState({
    name: '',
    age: '',
    gender: 'Female',
    village: '',
    phone: ''
  })

  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '',
    date: '',
    time: '',
    reason: ''
  })

  async function refreshData() {
    const patientData = await db.patients.toArray()
    const appointmentData = await db.appointments.toArray()

    setPatients(patientData)
    setAppointments(
      appointmentData.sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
      )
    )
  }

  useEffect(() => {
    refreshData()
  }, [])

  const today = new Date().toLocaleDateString('en-CA')

  const todayAppointments = appointments.filter(
    appointment =>
      appointment.date === today &&
      appointment.status === 'Scheduled'
  )

  const pendingSync =
    patients.filter(p => p.syncStatus === 'pending').length +
    appointments.filter(a => a.syncStatus === 'pending').length

  const filteredPatients = useMemo(() => {
    const term = search.toLowerCase()

    return patients.filter(patient =>
      patient.name.toLowerCase().includes(term) ||
      patient.patientId.toLowerCase().includes(term) ||
      patient.village.toLowerCase().includes(term)
    )
  }, [patients, search])

  async function addPatient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const patient: Patient = {
        patientId: `RHT-${Date.now()}`,
        name: patientForm.name.trim(),
        age: Number(patientForm.age),
        gender: patientForm.gender,
        village: patientForm.village.trim(),
        phone: patientForm.phone.trim(),
        createdAt: new Date().toISOString(),
        syncStatus: 'pending'
      }

      await db.patients.add(patient)
      await refreshData()

      setPatientForm({
        name: '',
        age: '',
        gender: 'Female',
        village: '',
        phone: ''
      })

      setShowPatientForm(false)
      setMessage('Patient registered successfully!')
    } catch {
      setMessage('Unable to register patient.')
    }
  }

  async function addAppointment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const selectedPatient = patients.find(
      p => p.patientId === appointmentForm.patientId
    )

    if (!selectedPatient) {
      setMessage('Please select a patient.')
      return
    }

    try {
      await db.appointments.add({
        patientId: selectedPatient.patientId,
        patientName: selectedPatient.name,
        date: appointmentForm.date,
        time: appointmentForm.time,
        reason: appointmentForm.reason.trim(),
        status: 'Scheduled',
        syncStatus: 'pending'
      })

      await refreshData()

      setAppointmentForm({
        patientId: '',
        date: '',
        time: '',
        reason: ''
      })

      setShowAppointmentForm(false)
      setMessage('Appointment scheduled successfully!')
    } catch {
      setMessage('Unable to schedule appointment.')
    }
  }

  async function updateAppointment(
    id: number,
    status: Appointment['status']
  ) {
    await db.appointments.update(id, {
      status,
      syncStatus: 'pending'
    })

    await refreshData()
    setMessage(`Appointment marked ${status.toLowerCase()}.`)
  }

  async function deletePatient(id: number) {
    const confirmed = window.confirm(
      'Delete this patient and their related records?'
    )

    if (!confirmed) return

    const patient = await db.patients.get(id)

    if (patient) {
      await db.transaction(
        'rw',
        db.patients,
        db.appointments,
        db.medicalRecords,
        db.vitals,
        async () => {
          await db.patients.delete(id)

          await db.appointments
            .where('patientId')
            .equals(patient.patientId)
            .delete()

          await db.medicalRecords
            .where('patientId')
            .equals(patient.patientId)
            .delete()

          await db.vitals
            .where('patientId')
            .equals(patient.patientId)
            .delete()
        }
      )

      await refreshData()
      setMessage('Patient and related records deleted.')
    }
  }

  const pageTitle: Record<Tab, string> = {
    overview: 'Dashboard',
    patients: 'Patient Management',
    appointments: 'Appointment Management',
    health: 'Medical Records & Health Monitoring',
    medicine: 'Medicine Inventory',
    fieldVisits: 'Field Visit Tracking',
    referrals: 'Referral Management',
    reports: 'Reports & Analytics'
  }

  return (
    <div className="app-shell">

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">✚</div>
          <div>
            <h2>Rural HealthTrack</h2>
            <span>Community Health System</span>
          </div>
        </div>

        <div className="nav-label">MAIN MENU</div>

        <button
          className={tab === 'overview' ? 'nav-item active' : 'nav-item'}
          onClick={() => setTab('overview')}
        >
          ◫ &nbsp; Dashboard
        </button>

        <button
          className={tab === 'patients' ? 'nav-item active' : 'nav-item'}
          onClick={() => setTab('patients')}
        >
          ♙ &nbsp; Patients
        </button>

        <button
          className={tab === 'appointments' ? 'nav-item active' : 'nav-item'}
          onClick={() => setTab('appointments')}
        >
          ▦ &nbsp; Appointments
        </button>

        <button
          className={tab === 'health' ? 'nav-item active' : 'nav-item'}
          onClick={() => setTab('health')}
        >
          ♡ &nbsp; Medical Records
        </button>

        <button
          className={tab === 'medicine' ? 'nav-item active' : 'nav-item'}
          onClick={() => setTab('medicine')}
        >
          ▤ &nbsp; Medicine Inventory
        </button>

        <button
          className={tab === 'fieldVisits' ? 'nav-item active' : 'nav-item'}
          onClick={() => setTab('fieldVisits')}
        >
          ◷ &nbsp; Field Visits
        </button>

        <button
          className={tab === 'referrals' ? 'nav-item active' : 'nav-item'}
          onClick={() => setTab('referrals')}
        >
          ⇢ &nbsp; Referrals
        </button>

        <button
          className={tab === 'reports' ? 'nav-item active' : 'nav-item'}
          onClick={() => setTab('reports')}
        >
          ▥ &nbsp; Reports & Analytics
        </button>

        <div className="sidebar-bottom">
          <div className="offline-card">
            <span className="online-dot" />
            <strong>Offline-ready mode</strong>
            <p>Records are stored on this device.</p>
            <small>{pendingSync} records awaiting sync</small>
          </div>
          <p className="version">Rural HealthTrack · Demo v2.0</p>
        </div>
      </aside>

      <main className="main-content">

        <header className="topbar">
          <div>
            <span className="breadcrumb">Community Clinic / </span>
            <strong>{pageTitle[tab]}</strong>
          </div>

          <div className="topbar-status">
            <span className="online-dot" />
            Offline storage active
          </div>
        </header>

        <section className="page-content">

          <div className="welcome">
            <div>
              <p className="eyebrow">RURAL HEALTHCARE MANAGEMENT</p>
              <h1>{pageTitle[tab]}</h1>
              <p>Manage community healthcare services in one place.</p>
            </div>

            <span className="date-label">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>

          {message && (
            <div className="notice" role="status">
              {message}
              <button onClick={() => setMessage('')}>×</button>
            </div>
          )}

          {tab === 'overview' && (
            <>
              <div className="stats-grid">

                <div className="stat-card">
                  <span className="stat-icon green">♙</span>
                  <p>Total Patients</p>
                  <h2>{patients.length}</h2>
                  <small>Registered on this device</small>
                </div>

                <div className="stat-card">
                  <span className="stat-icon blue">▦</span>
                  <p>Total Appointments</p>
                  <h2>{appointments.length}</h2>
                  <small>All recorded appointments</small>
                </div>

                <div className="stat-card">
                  <span className="stat-icon orange">◷</span>
                  <p>Today's Appointments</p>
                  <h2>{todayAppointments.length}</h2>
                  <small>Scheduled for today</small>
                </div>

                <div className="stat-card">
                  <span className="stat-icon purple">⇅</span>
                  <p>Pending Sync</p>
                  <h2>{pendingSync}</h2>
                  <small>Awaiting server connection</small>
                </div>

              </div>

              <div className="quick-actions">
                <h3>Quick Actions</h3>

                <button onClick={() => {
                  setTab('patients')
                  setShowPatientForm(true)
                }}>
                  + Register Patient
                </button>

                <button onClick={() => {
                  setTab('appointments')
                  setShowAppointmentForm(true)
                }}>
                  + Schedule Appointment
                </button>

                <button onClick={() => setTab('health')}>
                  + Medical Records
                </button>
              </div>

              <div className="dashboard-grid">
                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Recent Patients</h3>
                      <p>Recently registered records</p>
                    </div>
                    <button className="text-button"
                      onClick={() => setTab('patients')}>
                      View all →
                    </button>
                  </div>

                  {patients.length === 0 ? (
                    <div className="empty-state">
                      <strong>No patients registered yet</strong>
                    </div>
                  ) : patients.slice(-5).reverse().map(patient => (
                    <div className="list-row" key={patient.id}>
                      <div className="avatar">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="list-info">
                        <strong>{patient.name}</strong>
                        <small>
                          {patient.patientId} · {patient.village}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Upcoming Appointments</h3>
                      <p>Scheduled clinic visits</p>
                    </div>
                    <button className="text-button"
                      onClick={() => setTab('appointments')}>
                      View all →
                    </button>
                  </div>

                  {appointments.filter(a =>
                    a.status === 'Scheduled' && a.date >= today
                  ).length === 0 ? (
                    <div className="empty-state">
                      <strong>No upcoming appointments</strong>
                    </div>
                  ) : appointments.filter(a =>
                    a.status === 'Scheduled' && a.date >= today
                  ).slice(0, 5).map(appointment => (
                    <div className="list-row" key={appointment.id}>
                      <div className="calendar-icon">▦</div>
                      <div className="list-info">
                        <strong>{appointment.patientName}</strong>
                        <small>
                          {appointment.date} · {appointment.time}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'patients' && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Patient Directory</h3>
                  <p>{patients.length} patient records stored locally</p>
                </div>

                <button className="primary-button"
                  onClick={() => setShowPatientForm(!showPatientForm)}>
                  + Add Patient
                </button>
              </div>

              {showPatientForm && (
                <form className="form-grid" onSubmit={addPatient}>
                  <label>
                    Full Name *
                    <input required value={patientForm.name}
                      onChange={e => setPatientForm({
                        ...patientForm, name: e.target.value
                      })} />
                  </label>

                  <label>
                    Age *
                    <input required type="number" min="0" max="120"
                      value={patientForm.age}
                      onChange={e => setPatientForm({
                        ...patientForm, age: e.target.value
                      })} />
                  </label>

                  <label>
                    Gender
                    <select value={patientForm.gender}
                      onChange={e => setPatientForm({
                        ...patientForm, gender: e.target.value
                      })}>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                  </label>

                  <label>
                    Village *
                    <input required value={patientForm.village}
                      onChange={e => setPatientForm({
                        ...patientForm, village: e.target.value
                      })} />
                  </label>

                  <label>
                    Phone Number
                    <input type="tel" value={patientForm.phone}
                      onChange={e => setPatientForm({
                        ...patientForm, phone: e.target.value
                      })} />
                  </label>

                  <div className="form-actions">
                    <button type="button" className="secondary-button"
                      onClick={() => setShowPatientForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="primary-button">
                      Save Patient
                    </button>
                  </div>
                </form>
              )}

              <input className="search-input"
                placeholder="Search by patient name, ID or village..."
                value={search}
                onChange={e => setSearch(e.target.value)} />

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Patient ID</th>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Village</th>
                      <th>Phone</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPatients.map(patient => (
                      <tr key={patient.id}>
                        <td>{patient.patientId}</td>
                        <td>{patient.name}</td>
                        <td>{patient.age}</td>
                        <td>{patient.village}</td>
                        <td>{patient.phone || '—'}</td>
                        <td>
                          <button className="delete-button"
                            onClick={() => patient.id !== undefined &&
                              deletePatient(patient.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredPatients.length === 0 && (
                  <div className="empty-state">
                    No matching patient records found.
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'appointments' && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Appointment Schedule</h3>
                  <p>Manage clinic appointments</p>
                </div>

                <button className="primary-button"
                  onClick={() => setShowAppointmentForm(
                    !showAppointmentForm
                  )}>
                  + New Appointment
                </button>
              </div>

              {showAppointmentForm && (
                <form className="form-grid" onSubmit={addAppointment}>
                  <label>
                    Select Patient *
                    <select required value={appointmentForm.patientId}
                      onChange={e => setAppointmentForm({
                        ...appointmentForm, patientId: e.target.value
                      })}>
                      <option value="">Choose a patient</option>
                      {patients.map(patient => (
                        <option key={patient.id}
                          value={patient.patientId}>
                          {patient.name} ({patient.patientId})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Appointment Date *
                    <input required type="date" min={today}
                      value={appointmentForm.date}
                      onChange={e => setAppointmentForm({
                        ...appointmentForm, date: e.target.value
                      })} />
                  </label>

                  <label>
                    Appointment Time *
                    <input required type="time"
                      value={appointmentForm.time}
                      onChange={e => setAppointmentForm({
                        ...appointmentForm, time: e.target.value
                      })} />
                  </label>

                  <label>
                    Visit Reason *
                    <input required value={appointmentForm.reason}
                      onChange={e => setAppointmentForm({
                        ...appointmentForm, reason: e.target.value
                      })} />
                  </label>

                  <div className="form-actions">
                    <button type="button" className="secondary-button"
                      onClick={() => setShowAppointmentForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="primary-button">
                      Save Appointment
                    </button>
                  </div>
                </form>
              )}

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {appointments.map(appointment => (
                      <tr key={appointment.id}>
                        <td>{appointment.patientName}</td>
                        <td>{appointment.date}</td>
                        <td>{appointment.time}</td>
                        <td>{appointment.reason}</td>
                        <td>{appointment.status}</td>
                        <td>
                          {appointment.status === 'Scheduled' && (
                            <div className="action-group">
                              <button className="complete-button"
                                onClick={() => appointment.id !== undefined &&
                                  updateAppointment(
                                    appointment.id, 'Completed'
                                  )}>
                                Complete
                              </button>

                              <button className="delete-button"
                                onClick={() => appointment.id !== undefined &&
                                  updateAppointment(
                                    appointment.id, 'Cancelled'
                                  )}>
                                Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {appointments.length === 0 && (
                  <div className="empty-state">
                    No appointments scheduled yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'health' && <HealthModules />}

          {tab === 'medicine' && <MedicineModule />}

          {tab === 'fieldVisits' && <FieldVisitModule />}

          {tab === 'referrals' && <ReferralModule />}

          {tab === 'reports' && <ReportsModule />}

          <footer className="footer">
            Rural HealthTrack · Designed for low-connectivity clinics
          </footer>

        </section>
      </main>
    </div>
  )
}

export default App
