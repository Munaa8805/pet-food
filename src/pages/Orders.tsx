import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Order, Product, Pet } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Package,
  Calendar,
  DollarSign
} from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Link } from 'react-router-dom';

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const ordersPath = 'orders';
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Order));
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, ordersPath);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4">
        <h2 className="text-2xl font-black text-stone-900 mb-4">Please sign in to view your orders</h2>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'pending': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-stone-600 bg-stone-50 border-stone-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-20">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-black text-stone-900 tracking-tight mb-2">My Orders</h1>
            <p className="text-stone-500 font-medium">Track and manage your pet supply purchases</p>
          </div>
          <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-sm">
            <ShoppingBag className="w-8 h-8 text-emerald-500" />
          </div>
        </div>

        {orders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-20 text-center border border-stone-200 shadow-xl"
          >
            <div className="inline-flex p-6 bg-stone-100 rounded-full mb-6">
              <Package className="w-12 h-12 text-stone-300" />
            </div>
            <h3 className="text-2xl font-black text-stone-900 mb-2">No orders yet</h3>
            <p className="text-stone-500 mb-8 max-w-md mx-auto">
              You haven't placed any orders yet. Explore our shop to find the best supplies for your pet!
            </p>
            <Link 
              to="/products" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all"
            >
              Start Shopping
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[2.5rem] border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                        <Package className="w-8 h-8 text-stone-400 group-hover:text-emerald-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-black text-stone-400 uppercase tracking-widest">Order ID</span>
                          <span className="text-sm font-mono font-bold text-stone-600">#{order.id?.slice(-8).toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-stone-500 text-sm font-medium">
                            <Calendar className="w-4 h-4" />
                            {new Date(order.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </div>
                          <div className="w-1 h-1 bg-stone-300 rounded-full" />
                          <div className="flex items-center gap-2 text-emerald-600 text-lg font-black">
                            <DollarSign className="w-4 h-4" />
                            {order.totalPrice}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest flex items-center gap-2 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </div>
                      <Link 
                        to={order.productId ? `/product/${order.productId}` : order.petId ? `/pet/${order.petId}` : '#'}
                        className="p-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
