import { getDb } from './db'
import { net, BrowserWindow } from 'electron'

const API_BASE_URL = 'http://localhost:5000' // Updated to match backend

// Make a request using Electron's net module
const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const request = net.request({ url: API_BASE_URL + url, ...options })
    
    if (options.body) {
      request.write(options.body)
    }

    request.on('response', (response) => {
      let data = ''
      response.on('data', (chunk) => {
        data += chunk.toString()
      })
      response.on('end', () => {
        const logMsg = `[Sync API] ${options.method || 'GET'} ${url} -> Status ${response.statusCode}`
        console.log(logMsg)
        
        try {
          BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.executeJavaScript(`console.log('${logMsg}');`)
            if (data.length > 0 && response.statusCode === 200) {
              const snippet = data.length > 1000 ? data.substring(0, 1000) + '... (truncated)' : data;
              // Safely log the string snippet to the devtools console
              win.webContents.executeJavaScript(`console.log('Response:', ${JSON.stringify(snippet)});`)
            }
          })
        } catch(err) { /* ignore window errors */ }

        if (response.statusCode >= 200 && response.statusCode < 300) {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            resolve(data)
          }
        } else {
          reject(new Error(`API Error: ${response.statusCode} - ${data}`))
        }
      })
    })

    request.on('error', (err) => reject(err))
    request.end()
  })
}

export const pushSyncQueue = async () => {
  const db = getDb()
  // Get pending operations
  const pending = db.getPendingQueue()
  
  if (pending.length === 0) return

  console.log(`Pushing ${pending.length} operations to server...`)

  for (const op of pending) {
    try {
      if (op.table_name === 'customers' && op.operation === 'CREATE') {
        const data = op.data
        await makeRequest('/api/v1/sync/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: 'zazzauusers', operation: 'CREATE', data })
        })
        
        // Mark as synced
        db.markQueueSynced(op.id)
      }
    } catch (err) {
      if (err.message && err.message.includes('ERR_CONNECTION_REFUSED')) {
        console.log(`[Offline] Could not push sync operation (Server offline)`)
      } else {
        console.error('Failed to sync operation:', op.id, err.message)
      }
      break
    }
  }
}

export const pullSync = async () => {
  const db = getDb()
  const tablesToSync = [
    { local: 'customers', remote: 'zazzauusers' },
    { local: 'payments', remote: 'nmspayments' }, // mapping local 'payments' to backend 'nmspayments'
    { local: 'refunds', remote: 'refunds' }
  ]

  for (const tableMap of tablesToSync) {
    try {
      const metadata = db.getMetadata(tableMap.local)
      let url = `/api/v1/sync/${tableMap.remote}`
      if (metadata && metadata.last_updated_at) {
        url += `?last_updated_at=${encodeURIComponent(metadata.last_updated_at)}`
      }

      console.log(`Pulling updates from ${tableMap.remote}...`)
      const response = await makeRequest(url)
      
      if (response && response.data && response.data.length > 0) {
        const data = response.data
        let maxUpdatedAt = metadata ? metadata.last_updated_at : '1970-01-01T00:00:00Z'

        for (const row of data) {
          const rowUpdatedAt = row.updated_at || row.updatedAt || row.createdAt || new Date().toISOString()
          
          if (tableMap.local === 'customers') {
            db.upsertCustomer({
              id: row.id || row.ref,
              name: row.name || row.fullname || '',
              email: row.email || '',
              phone: row.phone || row.phonenumber || '',
              ippis: row.ippis || row.ippis_no || '',
              is_deleted: row.is_deleted ? 1 : 0,
              updated_at: rowUpdatedAt
            })
          } else if (tableMap.local === 'payments') {
            db.upsertPayment({
              id: row.id || row.ref,
              customer_id: row.customer_id || row.ippis || '',
              amount: row.amount || 0,
              date: row.date || row.createdAt || rowUpdatedAt,
              status: row.status || 'Completed',
              is_deleted: row.is_deleted ? 1 : 0,
              updated_at: rowUpdatedAt
            })
          } else if (tableMap.local === 'refunds') {
            db.upsertRefund({
              id: row.id || row.ref,
              customer_id: row.customer_id || row.ippis || '',
              amount: row.amount || 0,
              reason: row.reason || '',
              status: row.status || 'Pending',
              is_deleted: row.is_deleted ? 1 : 0,
              updated_at: rowUpdatedAt
            })
          }
          if (new Date(rowUpdatedAt) > new Date(maxUpdatedAt)) {
            maxUpdatedAt = rowUpdatedAt
          }
        }
        
        db.setMetadata(tableMap.local, maxUpdatedAt)
        console.log(`Pulled ${data.length} records for ${tableMap.local}.`)
      }
    } catch (err) {
      if (err.message.includes('ERR_CONNECTION_REFUSED')) {
        console.log(`[Offline] Could not connect to sync ${tableMap.local} (Server offline)`)
      } else {
        console.error(`Error pulling sync for ${tableMap.local}:`, err.message)
      }
    }
  }
}

export const startSyncEngine = () => {
  pushSyncQueue()
  pullSync()

  setInterval(() => {
    pushSyncQueue()
    pullSync()
  }, 30000)
}
