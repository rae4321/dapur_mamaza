import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function OrderHistory() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        // Ambil data orders beserta detail item makanan (join table) milik user saat ini
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              quantity,
              price_at_purchase,
              menus ( name )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }) // Pesanan terbaru paling atas

        if (error) throw error
        setOrders(data)
      } catch (error) {
        console.error('Error fetching order history:', error.message)
      } finally {
        setLoading(false)
      }
    }

    if (user) fetchOrderHistory()
  }, [user])

  // Fungsi pembantu warna label status biar interaktif
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Selesai':
        return 'bg-green-50 text-green-700 border border-green-200'
      case 'Sedang Diantar':
      case 'Sedang Dimasak':
        return 'bg-blue-50 text-blue-700 border border-blue-200'
      case 'Menunggu Verifikasi':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200'
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200'
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500 font-medium">Memuat Riwayat Pesanan...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
      <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
        Riwayat Pesanan Anda
      </h2>

      {orders.length === 0 ? (
        <div className="text-center bg-white rounded-2xl p-12 border border-gray-100 shadow-xs text-gray-400">
          Belum ada riwayat pemesanan makanan.<br />
          Mulai pesan menu lezatmu sekarang di Dashboard!
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
              
              {/* Header Card Pesanan */}
              <div className="flex flex-wrap justify-between items-center gap-2 border-b border-gray-50 pb-3">
                <div>
                  <p className="text-xs text-gray-400 font-medium">ID Pesanan: #{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${getStatusStyle(order.payment_status)}`}>
                  {order.payment_status}
                </span>
              </div>

              {/* Daftar Menu yang Dibeli */}
              <div className="space-y-2">
                {order.order_items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-gray-700">
                    <p className="font-medium">
                      {item.menus?.name} <span className="text-xs text-gray-400 font-normal">x{item.quantity}</span>
                    </p>
                    <p className="font-semibold text-gray-600">
                      Rp {(item.price_at_purchase * item.quantity).toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Total & Metode Pembayaran */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <div className="text-xs text-gray-400 font-medium">
                  Metode: <span className="font-bold text-gray-600">{order.payment_method}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block font-medium">Total Harga</span>
                  <span className="text-base font-black text-orange-600">
                    Rp {order.total_price.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}