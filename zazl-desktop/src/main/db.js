import { app } from 'electron'
import path from 'path'
import fs from 'fs'

const dbDir = path.join(app.getPath('userData'), 'database')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}
const dbPath = path.join(dbDir, 'app_database.json')

let data = { customers: [], payments: [], refunds: [], sync_queue: [], sync_metadata: [] }

export const initDb = () => {
  if (fs.existsSync(dbPath)) {
    try {
      data = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
      if (!data.payments) data.payments = []
      if (!data.refunds) data.refunds = []
      
      // Self-heal: Purge invalid string IDs that poisoned the queue previously
      data.sync_queue = data.sync_queue.filter(op => {
        if (op.data && typeof op.data.id === 'string' && op.data.id.startsWith('cust_')) return false;
        return true;
      })
      data.customers = data.customers.filter(c => !(typeof c.id === 'string' && c.id.startsWith('cust_')))
      
      // Save the cleaned DB
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
    } catch (e) {
      console.error('Failed to parse local DB', e)
    }
  } else {
    fs.writeFileSync(dbPath, JSON.stringify(data))
  }
}

const saveDb = () => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))

export const getDb = () => ({
  getCustomers: () => data.customers.filter(c => !c.is_deleted).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)),
  getPayments: () => data.payments.filter(p => !p.is_deleted).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)),
  getRefunds: () => data.refunds.filter(r => !r.is_deleted).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)),
  addCustomer: (cust) => {
    data.customers.push(cust)
    saveDb()
  },
  addQueue: (op) => {
    data.sync_queue.push({ id: Date.now(), ...op, status: 'pending', created_at: new Date().toISOString() })
    saveDb()
  },
  getPendingQueue: () => data.sync_queue.filter(q => q.status === 'pending').sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
  markQueueSynced: (id) => {
    const q = data.sync_queue.find(q => q.id === id)
    if (q) q.status = 'synced'
    saveDb()
  },
  getMetadata: (table) => data.sync_metadata.find(m => m.table_name === table),
  setMetadata: (table, last_updated_at) => {
    let m = data.sync_metadata.find(m => m.table_name === table)
    if (m) m.last_updated_at = last_updated_at
    else data.sync_metadata.push({ table_name: table, last_updated_at })
    saveDb()
  },
  upsertCustomer: (cust) => {
    const idx = data.customers.findIndex(c => c.id === cust.id)
    if (idx >= 0) {
      if (new Date(data.customers[idx].updated_at) < new Date(cust.updated_at)) {
        data.customers[idx] = cust
      }
    } else {
      data.customers.push(cust)
    }
    saveDb()
  },
  upsertPayment: (payment) => {
    const idx = data.payments.findIndex(p => p.id === payment.id)
    if (idx >= 0) {
      if (new Date(data.payments[idx].updated_at) < new Date(payment.updated_at)) {
        data.payments[idx] = payment
      }
    } else {
      data.payments.push(payment)
    }
    saveDb()
  },
  upsertRefund: (refund) => {
    const idx = data.refunds.findIndex(r => r.id === refund.id)
    if (idx >= 0) {
      if (new Date(data.refunds[idx].updated_at) < new Date(refund.updated_at)) {
        data.refunds[idx] = refund
      }
    } else {
      data.refunds.push(refund)
    }
    saveDb()
  }
})
