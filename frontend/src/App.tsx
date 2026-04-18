import { useEffect, useState } from 'react'
import { useAppStore } from './store'
import { Auth } from './components/Auth'
import { Layout } from './components/Layout'
import { Dashboard } from './components/Dashboard'
import { Transactions } from './components/Transactions'
import { Budgets } from './components/Budgets'
import { Goals } from './components/Goals'
import { api } from './lib/api'
import './index.css'

function App() {
  const { isAuthenticated, token, setAuth, setWorkspace, logout } = useAppStore()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function hydrateSession() {
      if (!token || !isAuthenticated) {
        if (!cancelled) setBooting(false)
        return
      }

      try {
        const result = await api.me()
        if (cancelled) return
        setAuth(token, result.user)
        setWorkspace(result.workspace)
      } catch {
        if (cancelled) return
        localStorage.removeItem('token')
        logout()
      } finally {
        if (!cancelled) setBooting(false)
      }
    }

    hydrateSession()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, logout, setAuth, setWorkspace, token])

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="rounded-2xl border border-border bg-card px-6 py-4 shadow-sm">
          Sto preparando il workspace...
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Auth onSuccess={() => setActiveTab('dashboard')} />
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'transactions' && <Transactions />}
      {activeTab === 'budgets' && <Budgets />}
      {activeTab === 'goals' && <Goals />}
    </Layout>
  )
}

export default App
