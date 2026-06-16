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
  
  // State Baru untuk Fitur Upload File Gambar
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    fetchAdminData()
  }, [adminSubTab])

  const fetchAdminData = async () => {
    if (adminSubTab === 'manage-menu') {
      const { data } = await supabase
        .from('menus')
        .select('*')
        .order('created_at', { ascending: false })
      setMenus(data || [])
    } else {
      try {
        // 1. Ambil data pesanan mentah secara mandiri
        const { data: rawOrders, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })

        if (orderError) throw orderError

        // 2. Ambil data pendukung secara paralel (Lebih Cepat & Efisien)
        const [resItems, resProfiles, resMenus] = await Promise.all([
          supabase.from('order_items').select('*'),
          supabase.from('profiles').select('*'),
          supabase.from('menus').select('*')
        ])

        const rawItems = resItems.data || []
        const allProfiles = resProfiles.data || []
        const allMenus = resMenus.data || []

        // 3. Jodohkan datanya di Front-end (100% Kebal Error Relasi SQL)
        const formattedOrders = (rawOrders || []).map((order) => {
          const matchedProfile = allProfiles.find((p) => p.id === order.user_id)
          const filteredItems = rawItems.filter((item) => item.order_id === order.id)

          const formattedItems = filteredItems.map((item) => {
            const matchedMenu = allMenus.find((m) => m.id === item.menu_id)
            return {
              ...item,
              menus: { name: matchedMenu ? matchedMenu.name : 'Menu Terhapus' }
            }
          })

          return {
            ...order,
            profiles: {
              full_name: matchedProfile ? matchedProfile.full_name : null
            },
            order_items: formattedItems
          }
        })

        setOrders(formattedOrders)
      } catch (err) {
        console.error('Gagal memuat data pelanggan:', err.message)
      }
    }
  }

  // Handle Perubahan File Gambar Lokal (Pratinjau sebelum upload)
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  // 1. Fungsi Tambah Menu Baru (Dengan Mengunggah Gambar ke Supabase Storage)
  const handleAddMenu = async (e) => {
    e.preventDefault()
    try {
      let finalImageUrl = null

      // Proses upload jika ada file gambar yang dipilih
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${fileName}`

        // Unggah file mentah ke Bucket 'menu-images'
        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(filePath, imageFile)

        if (uploadError) throw uploadError

        // Dapatkan URL Publik dari aset gambar yang diunggah
        const { data: publicUrlData } = supabase.storage
          .from('menu-images')
          .getPublicUrl(filePath)

        finalImageUrl = publicUrlData.publicUrl
      }

      // Masukkan data menu ke tabel 'menus'
      const { error } = await supabase.from('menus').insert({
        name: newName,
        price: parseInt(newPrice),
        category: newCategory,
        description: newDescription,
        image_url: finalImageUrl, // Menyimpan URL dari Supabase Storage
        is_available: true
      })
      
      if (error) throw error
      
      alert('Menu Baru Berhasil Ditambahkan!')
      
      // Reset Form State & File Preview
      setNewName('')
      setNewPrice('')
      setNewDescription('')
      setImageFile(null)
      setPreviewUrl('')
      
      fetchAdminData()
    } catch (err) {
      alert("Gagal menambah menu: " + err.message)
    }
  }

  // 2. Fungsi Mengubah Stok Ketersediaan Menu
  const toggleAvailability = async (id, currentStatus) => {
    try {
      await supabase.from('menus').update({ is_available: !currentStatus }).eq('id', id)
      fetchAdminData()
    } catch (err) {
      console.error(err)
    }
  }

  // 3. Fungsi Hapus Menu
  const handleDeleteMenu = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus menu ini dari daftar?')) {
      try {
        await supabase.from('menus').delete().eq('id', id)
        fetchAdminData()
      } catch (err) {
        console.error(err)
      }
    }
  }

  // 4. Fungsi Konfirmasi Perubahan Status Pesanan
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await supabase.from('orders').update({ payment_status: newStatus }).eq('id', orderId)
      alert(`Status pesanan berhasil diupdate menjadi: ${newStatus}`)
      fetchAdminData()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-black text-gray-900">Management Admin</h2>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl border">
          <button
            onClick={() => setAdminSubTab('manage-menu')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              adminSubTab === 'manage-menu' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-500'
            }`}
          >
            Kelola Menu
          </button>
          <button
            onClick={() => setAdminSubTab('manage-orders')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              adminSubTab === 'manage-orders' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-500'
            }`}
          >
            Pesanan Masuk
          </button>
        </div>
      </div>

      {/* ================= TAB 1: KELOLA DATA MENU ================= */}
      {adminSubTab === 'manage-menu' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form Create Menu (Updated with Image Upload) */}
          <form onSubmit={handleAddMenu} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 h-fit">
            <h3 className="font-extrabold text-gray-800 text-base">Tambah Menu Baru</h3>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Nama Makanan/Minuman</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Harga (Rp)</label>
                <input
                  type="number"
                  required
                  className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Kategori</label>
                <select
                  className="w-full px-3 py-2 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  <option>Makanan</option>
                  <option>Minuman</option>
                  <option>Cemilan</option>
                </select>
              </div>
            </div>

            {/* Input File Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">Foto Makanan/Minuman</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition duration-150">
                  <div className="flex flex-col items-center justify-center pt-4 pb-4 text-center px-2">
                    <p className="text-xs text-gray-500 font-bold">
                      {imageFile ? '🔄 Ganti Gambar' : '📸 Pilih / Ambil Gambar'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[220px">
                      {imageFile ? imageFile.name : 'PNG, JPG, JPEG (Max. 5MB)'}
                    </p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                </label>
              </div>
              
              {/* Box Preview File */}
              {previewUrl && (
                <div className="mt-2 p-2 bg-orange-50/50 rounded-xl border border-dashed border-orange-200 flex flex-col items-center justify-center space-y-1">
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Pratinjau Foto Pilihan:</span>
                  <img 
                    src={previewUrl} 
                    alt="Preview Upload" 
                    className="w-full h-32 object-cover rounded-lg border shadow-2xs"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Deskripsi Ringkas</label>
              <textarea
                rows="2"
                className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-xs active:scale-98">
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
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=80&h=80'}
                      className="w-12 h-12 rounded-lg object-cover"
                      alt={item.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=80&h=80";
                      }}
                    />
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-500">
                        Rp {item.price.toLocaleString('id-ID')} | <span className="text-orange-600 font-semibold">{item.category}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAvailability(item.id, item.is_available)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        item.is_available ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {item.is_available ? '🟢 Ready' : '🔴 Habis'}
                    </button>
                    <button
                      onClick={() => handleDeleteMenu(item.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                    >
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
        <div className="space-y-5">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="font-extrabold text-gray-800 text-lg">Seluruh Pesanan Pelanggan</h3>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full">
              {orders.length} Pesanan
            </span>
          </div>

          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition duration-200 space-y-4">
                
                {/* Header Card: ID & Nama Pelanggan */}
                <div className="flex flex-wrap justify-between items-start gap-2 border-b border-gray-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md">
                        ID: #{order.id?.slice(0, 8)}
                      </span>
                      {order.payment_method === 'QRIS' && (
                        <span className="text-[10px] font-extrabold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-sm tracking-wider">
                          QRIS
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-gray-800 pt-1">
                      Pelanggan:{' '}
                      <span className="text-orange-600 font-extrabold">
                        {order.profiles?.full_name || 'Pelanggan Dapur Mamaza'}
                      </span>
                    </h4>
                    <span className="text-[11px] text-gray-400 font-medium block">
                      User ID: {order.user_id?.slice(0, 13)}...
                    </span>
                  </div>

                  {/* Selector Update Status */}
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <label className="text-xs font-bold text-gray-500">Status:</label>
                    <select
                      value={order.payment_status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-lg border bg-white text-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none cursor-pointer shadow-xs"
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
<div className="space-y-2 bg-gray-50/70 p-4 rounded-xl border border-gray-100/50">
  <span className="text-xs font-bold text-gray-400 block tracking-wider uppercase mb-1">Daftar Menu:</span>
  {order.order_items?.map((item, idx) => (
    <div key={idx} className="flex flex-col gap-1 pb-2 last:pb-0 last:border-0 border-b border-gray-100/40">
      
      {/* BARIS UTAMA: NAMA MENU, KUANTITAS, DAN HARGA */}
      <div className="flex justify-between text-xs text-gray-700 items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-orange-500 font-bold">•</span>
          <span className="font-medium text-gray-800">{item.menus?.name || 'Menu Terhapus'}</span>
          <span className="bg-gray-200 text-gray-800 text-[10px] px-1.5 py-0.5 font-extrabold rounded-md ml-1">
            x{item.quantity}
          </span>
        </div>
        <span className="font-semibold text-gray-600">
          Rp {(item.price_at_purchase * item.quantity).toLocaleString('id-ID')}
        </span>
      </div>

      {/* --- BOX CATATAN: HANYA MUNCUL DI ADMIN JIKA PELANGGAN MENGISI CATATAN --- */}
      {item.notes && item.notes.trim() !== '' && (
        <div className="ml-3 mt-0.5 flex items-start gap-1 bg-amber-50 border border-amber-100/70 rounded-lg px-2 py-1 text-[11px] text-amber-800">
          {/* Ikon Sticky Note Kecil */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 mt-0.5 flex-shrink- text-amber-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
          <p className="leading-tight">
            <span className="font-bold">Catatan:</span> "{item.notes}"
          </p>
        </div>
      )}

    </div>
  ))}
  
  {/* Total Pembayaran */}
  <div className="border-t border-gray-200/60 pt-3 mt-2 flex justify-between items-center font-bold text-sm text-gray-800">
    <span className="text-xs text-gray-500 font-semibold">Total Pembayaran ({order.payment_method})</span>
    <span className="text-base text-emerald-600 font-extrabold">
      Rp {order.total_price?.toLocaleString('id-ID')}
    </span>
  </div>
</div>

{/* Kondisi Jika Bayar Menggunakan QRIS */}
{order.payment_method === 'QRIS' && (
  <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
    <span className="text-xs font-semibold text-gray-500">Bukti Transfer:</span>
    {order.payment_proof ? (
      <a 
        href={order.payment_proof} 
        target="_blank" 
        rel="noreferrer" 
        className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-extrabold hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition duration-150 cursor-pointer"
      >
        Lihat Bukti 
      </a>
    ) : (
      <span className="text-xs italic text-red-500 font-medium">Belum mengunggah bukti transfer</span>
    )}
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