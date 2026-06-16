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
        <div className="flex gap-2 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory scrollbar-none px-4 -mx-4 md:px-0 md:mx-0 [scrollbar-width:none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {['Semua', 'Makanan', 'Minuman', 'Cemilan'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition whitespace-nowrap snap-mini snap-start cursor-pointer border shadow-2xs ${
                category === cat ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid Menu Makanan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
    {/* HEADER KERANJANG */}
    <div className="flex items-center justify-center gap-2 border-b border-gray-100 pb-3 mb-2">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-orange-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
      <h3 className="font-black text-gray-800 text-base">Keranjang Belanja</h3>
    </div>
    
    {cart.length === 0 ? (
      <div className="text-center py-12 text-gray-400 text-sm">
        Keranjang masih kosong.<br />Yuk, pilih makanan sehatmu!
      </div>
    ) : (
      <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto my-2 pr-1">
        {cart.map((item) => (
          <div key={item.id} className="py-3 flex flex-col gap-2">
            
            {/* BARIS ATAS: INFO PRODUK & TOMBOL AKSI */}
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                <span className="text-xs text-gray-500">Rp {item.price.toLocaleString('id-ID')}</span>
              </div>

              {/* KONTROL KUANTITAS */}
              <div className="flex items-center gap-2.5">
                {/* Tombol Kurang */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-red-600 transition duration-150 cursor-pointer"
                >
                  {item.quantity === 1 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                    </svg>
                  )}
                </button>

                {/* Angka Kuantitas */}
                <span className="text-sm font-black text-gray-800 w-4 text-center">{item.quantity}</span>

                {/* Tombol Tambah */}
                <button
                  onClick={() => addToCart(item)}
                  className="w-7 h-7 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 hover:bg-orange-200 transition duration-150 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* BARIS BAWAH: KOLOM CATATAN MENU */}
            <div className="w-full text-sm">Catatan
              <input
                type="text"
                placeholder="contoh: sambalnya banyakin yaa..."
                value={item.notes || ''}
                onChange={(e) => {
                  // Fungsi inline untuk mengupdate properti 'notes' pada item yang sesuai
                  const updatedCart = cart.map((cartItem) =>
                    cartItem.id === item.id ? { ...cartItem, notes: e.target.value } : cartItem
                  );
                  setCart(updatedCart); // Pastikan fungsi setCart tersedia di parent component Anda
                }}
                className="w-full text-xs bg-gray-50 text-gray-600 placeholder-gray-400 border border-gray-100 focus:border-orange-200 focus:bg-white focus:outline-none rounded-lg px-2.5 py-1.5 transition"
              />
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

{/* RENDER MODAL CHECKOUT */}
{isCheckoutOpen && (
  <CheckoutModal
    cart={cart}
    totalPrice={totalPrice}
    onClose={() => setIsCheckoutOpen(false)}
    onOrderSuccess={() => {
      setCart([]) 
      setIsCheckoutOpen(false) 
    }}
  />
)}

</div>
)
}