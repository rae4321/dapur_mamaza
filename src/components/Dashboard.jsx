import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import CheckoutModal from './CheckoutModal'

export default function Dashboard() {
  const [menus, setMenus] = useState([])
  const [filteredMenus, setFilteredMenus] = useState([])
  const [category, setCategory] = useState('Semua')
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false) 

  // 1. Ambil data menu dari Supabase
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const { data, error } = await supabase
          .from('menus')
          .select('*')
          .eq('is_available', true)

        if (error) throw error
        setMenus(data)
        setFilteredMenus(data)
      } catch (error) {
        console.error('Error fetching menus:', error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMenus()
  }, [])

  // 2. Logika Filter Kategori
  useEffect(() => {
    if (category === 'Semua') {
      setFilteredMenus(menus)
    } else {
      setFilteredMenus(menus.filter((item) => item.category === category))
    }
  }, [category, menus])

  // 3. Logika Tambah ke Keranjang
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id)
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        )
      }
      return [...prevCart, { ...item, quantity: 1 }]
    })
  }

  // 4. Logika Kurangi/Hapus dari Keranjang
  const removeFromCart = (id) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === id)
      if (existingItem.quantity === 1) {
        return prevCart.filter((cartItem) => cartItem.id !== id)
      }
      return prevCart.map((cartItem) =>
        cartItem.id === id ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem
      )
    })
  }

  // 5. Hitung Total Harga
  const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  if (loading) {
    return <div className="text-center mt-20 text-gray-600 font-semibold">Memuat Menu...</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* AREA KIRI & TENGAH: DAFTAR MENU */}
      <div className="lg:col-span-2 space-y-6">
        {/* Filter Kategori Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['Semua', 'Makanan', 'Minuman', 'Cemilan'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                category === cat ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid Menu Makanan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredMenus.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between p-4">
              <div className="flex gap-4">
                {/* Gambar Menu */}
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200&h=200'}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-xl bg-gray-100"
                />
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md">{item.category}</span>
                  <h3 className="font-bold text-gray-800 text-lg mt-1">{item.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.description || 'Tidak ada deskripsi.'}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-50">
                <span className="font-extrabold text-gray-900 text-base">Rp {item.price.toLocaleString('id-ID')}</span>
                <button
                  onClick={() => addToCart(item)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                Tambah
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AREA KANAN: RINGKASAN KERANJANG BELANJA */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-fit sticky top-4 flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-center justify-center text-gray-800 text-lg border-b border-gray-100 pb-3">Keranjang Belanja</h3>
          
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              Keranjang masih kosong.<br />Yuk, pilih makanan sehatmu!
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto my-2 pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-3">
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                    <span className="text-xs text-gray-500">Rp {item.price.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200 text-xs cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold text-gray-800 w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center font-bold text-orange-600 hover:bg-orange-200 text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-gray-100 pt-4 mt-2">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-500 font-medium">Total Pembayaran:</span>
              <span className="text-lg font-black text-gray-900">Rp {totalPrice.toLocaleString('id-ID')}</span>
            </div>
            <button 
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-md shadow-orange-100 cursor-pointer"
            >
              Lanjut ke Checkout
            </button>
          </div>
        )}
      </div>

      {/* --- INI KODE YANG DI-TAMBAH: RENDER MODAL CHECKOUT KETIKA TRUE --- */}
      {isCheckoutOpen && (
        <CheckoutModal
          cart={cart}
          totalPrice={totalPrice}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderSuccess={() => {
            setCart([]) // Mengosongkan keranjang setelah order sukses
            setIsCheckoutOpen(false) // Menutup modal otomatis
          }}
        />
      )}

    </div>
  )
}