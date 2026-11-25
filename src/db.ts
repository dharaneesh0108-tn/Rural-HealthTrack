
import Dexie, { type Table } from 'dexie'

export interface Patient {
  id?: number
  patientId: string
  name: string
  age: number
  gender: string
  village: string
  phone: string
  createdAt: string
  syncStatus: 'pending' | 'synced'
}

export interface Appointment {
  id?: number
  patientId: string
  patientName: string
  date: string
  time: string
  reason: string
  status: 'Scheduled' | 'Completed' | 'Cancelled'
  syncStatus: 'pending' | 'synced'
}

export interface MedicalRecord {
  id?: number
  patientId: string
  date: string
  notes: string
  recordedBy: string
  syncStatus: 'pending' | 'synced'
}

export interface VitalRecord {
  id?: number
  patientId: string
  date: string
  bloodPressure: string
  temperature: number
  pulse: number
  spo2: number
  weight: number
  recordedBy: string
  syncStatus: 'pending' | 'synced'
}

export interface HealthWorker {
  id?: number
  workerId: string
  name: string
  phone: string
  village: string
  role: string
}

export interface MedicineItem {
  id?: number
  name: string
  quantity: number
  unit: string
  expiryDate: string
  minimumStock: number
}

export interface FieldVisit {
  id?: number
  patientId: string
  workerId: string
  visitDate: string
  notes: string
  followUpDate: string
  status: 'Completed' | 'Follow-up Required'
}

export interface Referral {
  id?: number
  patientId: string
  facility: string
  reason: string
  referralDate: string
  status: 'Pending' | 'Accepted' | 'Completed'
}

class HealthDatabase extends Dexie {
  patients!: Table<Patient, number>
  appointments!: Table<Appointment, number>
  medicalRecords!: Table<MedicalRecord, number>
  vitals!: Table<VitalRecord, number>
  healthWorkers!: Table<HealthWorker, number>
  medicines!: Table<MedicineItem, number>
  fieldVisits!: Table<FieldVisit, number>
  referrals!: Table<Referral, number>

  constructor() {
    super('RuralHealthTrack')

    this.version(1).stores({
      patients: '++id, &patientId, name, village, syncStatus',
      appointments: '++id, patientId, date, status, syncStatus'
    })

    this.version(2).stores({
      patients: '++id, &patientId, name, village, syncStatus',
      appointments: '++id, patientId, date, status, syncStatus',
      medicalRecords: '++id, patientId, date, syncStatus',
      vitals: '++id, patientId, date, syncStatus',
      healthWorkers: '++id, &workerId, name, village',
      medicines: '++id, name, expiryDate',
      fieldVisits: '++id, patientId, workerId, visitDate, status',
      referrals: '++id, patientId, referralDate, status'
    })
  }
}

export const db = new HealthDatabase()
