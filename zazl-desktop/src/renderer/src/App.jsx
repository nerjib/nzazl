import { useState, useEffect } from 'react'
import './assets/main.css'

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [currentView, setCurrentView] = useState('login') // 'login', 'customers', 'payments', 'refunds'
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Data states
  const [customers, setCustomers] = useState([])
  const [payments, setPayments] = useState([])
  const [refunds, setRefunds] = useState([])

  // Login form state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (isAuthenticated) {
      fetchData()
      // Auto-refresh data every 5 seconds to show new sync results
      const intervalId = setInterval(fetchData, 5000)
      
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        clearInterval(intervalId)
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isAuthenticated])

  const fetchData = async () => {
    if (window.api) {
      try {
        if (window.api.getCustomers) {
          const custs = await window.api.getCustomers();
          console.log('Fetched customers:', custs.length);
          setCustomers(custs);
        }
        if (window.api.getPayments) {
          const pays = await window.api.getPayments();
          console.log('Fetched payments:', pays.length);
          setPayments(pays);
        }
        if (window.api.getRefunds) {
          const refs = await window.api.getRefunds();
          console.log('Fetched refunds:', refs.length);
          setRefunds(refs);
        }
      } catch (err) {
        console.error('Error fetching data from local DB:', err);
      }
    }
  }

  const handleRefresh = async () => {
    if (!isOnline) return
    setIsSyncing(true)
    if (window.api && window.api.forceSync) {
      await window.api.forceSync()
    }
    await fetchData()
    setIsSyncing(false)
  }

  const handleLogin = (e) => {
    e.preventDefault()
    // Mock authentication: accept admin/password or any non-empty fallback for now
    if (username === 'admin' && password === 'password') {
      setIsAuthenticated(true)
      setCurrentView('customers')
      setLoginError('')
    } else {
      setLoginError('Invalid credentials. Use admin/password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentView('login')
    setUsername('')
    setPassword('')
  }

  if (!isAuthenticated || currentView === 'login') {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Admin Login</h2>
          {loginError && <div style={styles.errorAlert}>{loginError}</div>}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={styles.input}
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.primaryButton}>Sign In</button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '12px', color: '#666' }}>
            Offline-First App &middot; {isOnline ? '🟢 Online' : '🔴 Offline'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.dashboardContainer}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h3>Zazzau Admin</h3>
        </div>
        <ul style={styles.menuList}>
          <li 
            style={currentView === 'customers' ? styles.menuItemActive : styles.menuItem} 
            onClick={() => setCurrentView('customers')}
          >
            Customers
          </li>
          <li 
            style={currentView === 'payments' ? styles.menuItemActive : styles.menuItem} 
            onClick={() => setCurrentView('payments')}
          >
            Payments
          </li>
          <li 
            style={currentView === 'refunds' ? styles.menuItemActive : styles.menuItem} 
            onClick={() => setCurrentView('refunds')}
          >
            Refunds
          </li>
        </ul>
        <div style={styles.sidebarFooter}>
          <button onClick={handleLogout} style={styles.outlineButton}>Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2>{currentView.charAt(0).toUpperCase() + currentView.slice(1)}</h2>
            <span style={{ fontSize: '12px', color: '#666' }}>
              (Debug: Customers={customers.length}, Payments={payments.length})
            </span>
            {isOnline && (
              <button 
                onClick={handleRefresh} 
                disabled={isSyncing}
                style={{ ...styles.outlineButton, width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              >
                {isSyncing ? 'Syncing...' : '↻ Refresh'}
              </button>
            )}
          </div>
          <div style={isOnline ? styles.badgeOnline : styles.badgeOffline}>
            {isOnline ? '🟢 SYNCING ONLINE' : '🔴 WORKING OFFLINE'}
          </div>
        </div>

        <div style={styles.contentArea}>
          {currentView === 'customers' && (
            <div>
              <div style={styles.tableHeaderRow}>
                <strong>ID</strong>
                <strong>Name</strong>
                <strong>IPPIS</strong>
                <strong>Email</strong>
              </div>
              {customers.length === 0 ? <p>No customers found.</p> : customers.map(c => (
                <div key={c.id} style={styles.tableRow}>
                  <span>{String(c.id).substring(0,8)}...</span>
                  <span>{c.name}</span>
                  <span>{c.ippis}</span>
                  <span>{c.email}</span>
                </div>
              ))}
            </div>
          )}

          {currentView === 'payments' && (
            <div>
              <div style={styles.tableHeaderRow}>
                <strong>ID</strong>
                <strong>Customer Ref</strong>
                <strong>Amount (₦)</strong>
                <strong>Status</strong>
              </div>
              {payments.length === 0 ? <p>No payments found.</p> : payments.map(p => (
                <div key={p.id} style={styles.tableRow}>
                  <span>{String(p.id).substring(0,8)}...</span>
                  <span>{p.customer_id}</span>
                  <span>{Number(p.amount || 0).toLocaleString()}</span>
                  <span style={{ color: p.status === 'Completed' ? 'green' : 'orange' }}>{p.status}</span>
                </div>
              ))}
            </div>
          )}

          {currentView === 'refunds' && (
            <div>
              <div style={styles.tableHeaderRow}>
                <strong>ID</strong>
                <strong>Customer Ref</strong>
                <strong>Amount (₦)</strong>
                <strong>Reason</strong>
              </div>
              {refunds.length === 0 ? <p>No refunds found.</p> : refunds.map(r => (
                <div key={r.id} style={styles.tableRow}>
                  <span>{String(r.id).substring(0,8)}...</span>
                  <span>{r.customer_id}</span>
                  <span style={{ color: 'red' }}>-{Number(r.amount || 0).toLocaleString()}</span>
                  <span>{r.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  loginContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f4f7f6',
    fontFamily: 'system-ui, sans-serif'
  },
  loginCard: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '360px'
  },
  input: {
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box'
  },
  primaryButton: {
    padding: '12px',
    backgroundColor: '#27AE60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  outlineButton: {
    padding: '10px',
    backgroundColor: 'transparent',
    color: '#333',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%'
  },
  errorAlert: {
    padding: '10px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    marginBottom: '15px',
    fontSize: '14px'
  },
  dashboardContainer: {
    display: 'flex',
    height: '100vh',
    fontFamily: 'system-ui, sans-serif',
    backgroundColor: '#f4f7f6'
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column'
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid #e0e0e0',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '20px',
    color: '#27AE60'
  },
  menuList: {
    listStyleType: 'none',
    padding: '0',
    margin: '0',
    flex: 1
  },
  menuItem: {
    padding: '15px 20px',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
    color: '#333'
  },
  menuItemActive: {
    padding: '15px 20px',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
    backgroundColor: '#eafaf1',
    color: '#27AE60',
    fontWeight: 'bold',
    borderLeft: '4px solid #27AE60'
  },
  sidebarFooter: {
    padding: '20px',
    borderTop: '1px solid #e0e0e0'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    padding: '20px 30px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  badgeOnline: {
    padding: '6px 12px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  badgeOffline: {
    padding: '6px 12px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  contentArea: {
    padding: '30px',
    overflowY: 'auto',
    flex: 1
  },
  tableHeaderRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr 1fr 1fr',
    padding: '15px',
    backgroundColor: '#eef2f5',
    borderBottom: '2px solid #ddd',
    borderRadius: '8px 8px 0 0',
    color: '#333'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr 1fr 1fr',
    padding: '15px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #eee',
    color: '#333'
  }
}

export default App
