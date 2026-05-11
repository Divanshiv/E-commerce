import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const location = useLocation();
  const orderNumber = location.state?.orderNumber || null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={40} />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-500 mb-6">
            Thank you for your purchase. Your order has been confirmed.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
            {orderNumber && (
              <>
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="font-mono font-bold text-lg">{orderNumber}</p>
                </div>
              </>
            )}
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-mono text-gray-700 text-sm break-all">{orderId}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/orders"
              className="block w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              View Order Details
            </Link>
            <Link
              to="/products"
              className="block w-full border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
