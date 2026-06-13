import { useState } from 'react'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import OrderHistory from './components/OrderHistory'
import AdminPanel from './components/AdminPanel' // <-- Import komponen admin baru nanti
import { useAuth } from './context/AuthContext'

function App() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('menu')

  // GANTI EMAIL INI DENGAN EMAIL ADMIN UTAMA ANDA
  const ADMIN_EMAIL = 'jkotriady@gmail.com' 
  const isAdmin = user?.email === ADMIN_EMAIL

  if (!user) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black tracking-tight text-orange-600">
            Dapur Mamaza
          </h1>
          
          {/* Navigasi Tab */}
          <div className="hidden sm:flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'menu' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Menu Makanan
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'history' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Riwayat Order
            </button>
            
            {/* JIKA ADMIN, TAMPILKAN TOMBOL INI */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'admin' ? 'bg-red-600 text-white shadow-xs' : 'text-red-500 hover:text-red-700'
                }`}
              >
                Admin Panel
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-600">
            Halo, {user.user_metadata?.full_name || 'Pelanggan'} {isAdmin && '(Admin)'}
          </span>
          <button onClick={signOut} className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer">
            Keluar
          </button>
        </div>
      </nav>

      {/* Navigasi Mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-2 px-4 flex justify-around z-50 shadow-lg">
        <button onClick={() => setActiveTab('menu')} className={`flex flex-col items-center text-xs font-bold ${activeTab === 'menu' ? 'text-orange-600' : 'text-gray-400'}`}>
          <span></span> Menu
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center text-xs font-bold ${activeTab === 'history' ? 'text-orange-600' : 'text-gray-400'}`}>
          <span></span> Riwayat
        </button>
        {isAdmin && (
          <button onClick={() => setActiveTab('admin')} className={`flex flex-col items-center text-xs font-bold ${activeTab === 'admin' ? 'text-red-600' : 'text-gray-400'}`}>
            <span></span> Admin
          </button>
        )}
      </div>

      {/* Konten Halaman */}
      <main className="py-4 pb-20 sm:pb-4">
        {activeTab === 'menu' && <Dashboard />}
        {activeTab === 'history' && <OrderHistory />}
        {activeTab === 'admin' && isAdmin && <AdminPanel />}
      </main>
    </div>
  )
}

export default App