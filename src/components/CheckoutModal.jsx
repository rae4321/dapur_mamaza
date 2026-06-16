import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function CheckoutModal({ cart, totalPrice, onClose, onOrderSuccess }) {
  const { user } = useAuth()
  const [address, setAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUploadFile = async (orderId) => {
    if (!file) return null
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${orderId}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // Upload ke bucket 'payment-proofs' di Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Ambil URL publik dari file yang di-upload
    const { data } = supabase.storage.from('payment-proofs').getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Buat data pesanan utama di tabel 'orders'
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_price: totalPrice,
          payment_method: paymentMethod,
          shipping_address: address,
          payment_status: paymentMethod === 'QRIS' ? 'Menunggu Verifikasi' : 'Menunggu Pembayaran'
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 2. Jika pilih QRIS, upload bukti transfernya
      if (paymentMethod === 'QRIS' && file) {
        const publicUrl = await handleUploadFile(orderData.id)
        if (publicUrl) {
          await supabase
            .from('orders')
            .update({ payment_proof: publicUrl })
            .eq('id', orderData.id)
        }
      }

      // 3. Masukkan item detail ke tabel 'order_items' (DENGAN CATATAN/NOTES)
      const orderItemsData = cart.map((item) => ({
        order_id: orderData.id,
        menu_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
        notes: item.notes || '' // << BARIS INI YANG DITAMBAHKAN AGAR AMBIL DATA DARI CART INPUT
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData)

      if (itemsError) throw itemsError

      alert('Pesanan Anda Berhasil Dibuat!')
      onOrderSuccess() // Kosongkan keranjang dan tutup modal
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
          <h3 className="font-extrabold text-xl text-gray-800">Detail Pesanan</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer">✕</button>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs mb-4">{error}</div>}

        <form onSubmit={handleSubmitOrder} className="space-y-4">

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Metode Pembayaran</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`py-3 rounded-xl text-sm font-bold border transition cursor-pointer ${
                  paymentMethod === 'Tunai' ? 'border-orange-500 bg-orange-50/50 text-orange-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setPaymentMethod('Tunai')}
              >
                Tunai
              </button>
              <button
                type="button"
                className={`py-3 rounded-xl text-sm font-bold border transition cursor-pointer ${
                  paymentMethod === 'QRIS' ? 'border-orange-500 bg-orange-50/50 text-orange-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setPaymentMethod('QRIS')}
              >
                QRIS
              </button>
            </div>
          </div>

          {/* Jika memilih QRIS, tampilkan Kode QR Statis & Form Upload */}
          {paymentMethod === 'QRIS' && (
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center space-y-3">
              <p className="text-xs text-gray-500">Silakan scan QRIS di bawah ini & masukkan nominal <b>Rp {totalPrice.toLocaleString('id-ID')}</b></p>
              
              <img
                src="/QRIS.jpeg"
                alt="QRIS Dapur Mamaza"
                className="w-40 h-full mx-auto rounded-lg border bg-white p-2 shadow-xs"
              />
              
              <div>
                <label className="block text-left text-xs font-bold text-gray-600 mb-1">Upload Bukti Transfer</label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 cursor-pointer"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
            <div>
              <span className="text-xs text-gray-400 block">Total Tagihan</span>
              <span className="text-lg font-black text-gray-900">Rp {totalPrice.toLocaleString('id-ID')}</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition disabled:bg-gray-400 cursor-pointer"
            >
              {loading ? 'Memproses Order...' : 'Konfirmasi Pesanan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}