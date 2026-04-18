import { useState, useEffect } from 'react'
import { useAppStore } from './store'
import { Auth } from './components/Auth'
import { Layout } from './components/Layout'
import { Dashboard } from './components/Dashboard'
import { Transactions } from './components/Transactions'
import { Budgets } from './components/Budgets'
import { Goals } from './components/Goals'
import './index.css'

function App() {
  const { isAuthenticated } = useAppStore()
  const [activeTab, setActiveTab] = useState('dashboard')

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
