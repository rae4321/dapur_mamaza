import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AdminPanel() {
  const [adminSubTab, setAdminSubTab] = useState('manage-menu') // 'manage-menu' atau 'manage-orders'
  const [menus, setMenus] = useState([])
  const [orders, setOrders] = useState([])
  
  // State Form Tambah Menu Baru
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newCategory, setNewCategory] = useState('Makanan')
  const [newDescription, setNewDescription] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')

  useEffect(() => {
    fetchAdminData()
  }, [adminSubTab])

  const fetchAdminData = async () => {
    if (adminSubTab === 'manage-menu') {
      const { data } = await supabase.from('menus').select('*').order('created_at', { ascending: false })
      setMenus(data || [])
    } else {
      const { data } = await supabase.from('orders').select('*, order_items(*, menus(name))').order('created_at', { ascending: false })
      setOrders(data || [])
    }
  }

  // 1. Fungsi Tambah Menu Baru
  const handleAddMenu = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('menus').insert({
        name: newName,
        price: parseInt(newPrice),
        category: newCategory,
        description: newDescription,
        image_url: newImageUrl || null,
        is_available: true
      })
      if (error) throw error
      alert('Menu Baru Berhasil Ditambahkan!')
      setNewName(''); setNewPrice(''); setNewDescription(''); setNewImageUrl('')
      fetchAdminData()
    } catch (err) { alert(err.message) }
  }

  // 2. Fungsi Mengubah Stok Ketersediaan Menu
  const toggleAvailability = async (id, currentStatus) => {
    try {
      await supabase.from('menus').update({ is_available: !currentStatus }).eq('id', id)
      fetchAdminData()
    } catch (err) { console.error(err) }
  }

  // 3. Fungsi Hapus Menu
  const handleDeleteMenu = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus menu ini dari daftar?')) {
      try {
        await supabase.from('menus').delete().eq('id', id)
        fetchAdminData()
      } catch (err) { console.error(err) }
    }
  }

  // 4. Fungsi Konfirmasi Perubahan Status Pesanan
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await supabase.from('orders').update({ payment_status: newStatus }).eq('id', orderId)
      alert(`Status pesanan berhasil diupdate menjadi: ${newStatus}`)
      fetchAdminData()
    } catch (err) { alert(err.message) }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-black text-gray-900">Halaman Management Admin</h2>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl border">
          <button
            onClick={() => setAdminSubTab('manage-menu')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${adminSubTab === 'manage-menu' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-500'}`}
          >
          Kelola Menu
          </button>
          <button
            onClick={() => setAdminSubTab('manage-orders')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${adminSubTab === 'manage-orders' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-500'}`}
          >
          Pesanan Masuk
          </button>
        </div>
      </div>

      {/* ================= TAB 1: KELOLA DATA MENU ================= */}
      {adminSubTab === 'manage-menu' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Create Menu */}
          <form onSubmit={handleAddMenu} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 h-fit">
            <h3 className="font-extrabold text-gray-800 text-base">Tambah Menu Baru</h3>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Nama Makanan/Minuman</label>
              <input type="text" required className="w-full px-3 py-2 text-sm border rounded-xl" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Harga (Rp)</label>
                <input type="number" required className="w-full px-3 py-2 text-sm border rounded-xl" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Kategori</label>
                <select className="w-full px-3 py-2 text-sm border rounded-xl bg-white" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                  <option>Makanan</option><option>Minuman</option><option>Cemilan</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Link URL Gambar (Opsional)</label>
              <input type="url" placeholder="https://..." className="w-full px-3 py-2 text-sm border rounded-xl" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Deskripsi Ringkas</label>
              <textarea rows="2" className="w-full px-3 py-2 text-sm border rounded-xl" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            </div>
            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-xs">
              Simpan Menu 
            </button>
          </form>

          {/* List Data Menu dengan Aksi Edit Stok & Delete */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-extrabold text-gray-800 text-base">Daftar Menu Aktif ({menus.length})</h3>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden divide-y divide-gray-50">
              {menus.map((item) => (
                <div key={item.id} className="p-4 flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <img src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=80&h=80'} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-500">Rp {item.price.toLocaleString('id-ID')} | <span className="text-orange-600 font-semibold">{item.category}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Switch Toggle Stok */}
                    <button
                      onClick={() => toggleAvailability(item.id, item.is_available)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${item.is_available ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                    >
                      {item.is_available ? '🟢 Ready' : '🔴 Habis'}
                    </button>
                    {/* Delete Button */}
                    <button onClick={() => handleDeleteMenu(item.id)} className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: KELOLA STATUS ORDERAN MASUK ================= */}
      {adminSubTab === 'manage-orders' && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-gray-800 text-base">Seluruh Pesanan Pelanggan ({orders.length})</h3>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-gray-50 pb-3">
                  <div>
                    <span className="text-xs font-bold text-gray-400 block">ID: #{order.id.slice(0,8)}</span>
                    <span className="text-xs text-gray-500 font-semibold">User ID: {order.user_id.slice(0,13)}...</span>

                  </div>
                  {/* Selector Update Status */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-500">Ubah Status:</label>
                    <select
                      value={order.payment_status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-xl border bg-gray-50 text-gray-700 focus:outline-none cursor-pointer"
                    >
                      <option>Menunggu Pembayaran</option>
                      <option>Menunggu Verifikasi</option>
                      <option>Sedang Dimasak</option>
                      <option>Sedang Diantar</option>
                      <option>Selesai</option>
                    </select>
                  </div>
                </div>

                {/* Detail Menu Yang Diorder Pelanggan */}
                <div className="space-y-1 bg-gray-50/50 p-3 rounded-xl">
                  {order.order_items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-gray-600">
                      <span>• {item.menus?.name} <b>x{item.quantity}</b></span>
                      <span>Rp {(item.price_at_purchase * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold text-sm text-gray-800">
                    <span>Total Pembayaran ({order.payment_method})</span>
                    <span className="text-orange-600">Rp {order.total_price.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Alamat Pengantaran */}
                <div className="text-xs text-gray-600">
                  <b className="text-gray-500 block mb-0.5">Alamat Tujuan Kirim:</b>
                  {order.shipping_address}
                </div>

                {/* Jika bayar QRIS dan ada bukti transfer, tampilkan tombol lihat bukti */}
                {order.payment_proof && (
                  <div className="pt-2">
                    <a href={order.payment_proof} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold hover:underline">
                      Klik Sini Untuk Lihat Bukti Transfer QRIS
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}