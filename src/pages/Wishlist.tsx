import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { WishlistItem, Pet, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Trash2, 
  ChevronRight, 
  ShoppingBag,
  PawPrint,
  ArrowRight
} from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Link } from 'react-router-dom';

interface WishlistDisplayItem {
  wishlistId: string;
  item: Pet | Product;
  type: 'pet' | 'product';
}

export default function Wishlist() {
  const { user, loading: authLoading } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const wishlistPath = 'wishlists';
    const q = query(
      collection(db, 'wishlists'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const items: WishlistDisplayItem[] = [];
      
      for (const wishlistDoc of snapshot.docs) {
        const data = wishlistDoc.data() as WishlistItem;
        const itemRef = doc(db, data.itemType === 'pet' ? 'pets' : 'products', data.itemId);
        
        try {
          const itemSnap = await getDoc(itemRef);
          if (itemSnap.exists()) {
            items.push({
              wishlistId: wishlistDoc.id,
              item: { id: itemSnap.id, ...itemSnap.data() } as Pet | Product,
              type: data.itemType
            });
          }
        } catch (error) {
          console.error(`Error fetching wishlist item ${data.itemId}:`, error);
        }
      }
      
      setWishlistItems(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, wishlistPath);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const removeFromWishlist = async (wishlistId: string) => {
    try {
      await deleteDoc(doc(db, 'wishlists', wishlistId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `wishlists/${wishlistId}`);
    }
  };

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
        <Heart className="w-16 h-16 text-stone-300 mb-6" />
        <h2 className="text-2xl font-black text-stone-900 mb-4">Sign in to see your wishlist</h2>
        <p className="text-stone-500 mb-8 text-center max-w-sm">
          Save your favorite pets and supplies to keep track of them for later.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-black text-stone-900 tracking-tight mb-2">My Wishlist</h1>
            <p className="text-stone-500 font-medium">Items you've saved for later</p>
          </div>
          <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-sm">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
          </div>
        </div>

        {wishlistItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-20 text-center border border-stone-200 shadow-xl"
          >
            <div className="inline-flex p-6 bg-stone-100 rounded-full mb-6">
              <Heart className="w-12 h-12 text-stone-300" />
            </div>
            <h3 className="text-2xl font-black text-stone-900 mb-2">Your wishlist is empty</h3>
            <p className="text-stone-500 mb-8 max-w-md mx-auto">
              Start exploring our pets and products and click the heart icon to save them here!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all"
              >
                Find a Pet
                <PawPrint className="w-5 h-5" />
              </Link>
              <Link 
                to="/products" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all"
              >
                Shop Supplies
                <ShoppingBag className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {wishlistItems.map(({ wishlistId, item, type }) => (
                <motion.div
                  key={wishlistId}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className="bg-white rounded-[2.5rem] border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group relative"
                >
                  <button 
                    onClick={() => removeFromWishlist(wishlistId)}
                    className="absolute top-4 right-4 z-10 p-3 bg-white/90 backdrop-blur-sm text-stone-400 hover:text-rose-600 rounded-2xl shadow-sm transition-all opacity-0 group-hover:opacity-100"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <Link to={type === 'pet' ? `/pet/${item.id}` : `/product/${item.id}`}>
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-4 left-4">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${
                          type === 'pet' 
                            ? 'bg-emerald-500/80 text-white border-emerald-400/50' 
                            : 'bg-stone-900/80 text-white border-stone-700/50'
                        }`}>
                          {type}
                        </span>
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-black text-stone-900 group-hover:text-emerald-600 transition-colors">{item.name}</h3>
                          <p className="text-stone-500 font-medium text-sm">
                            {type === 'pet' ? (item as Pet).breed : (item as Product).category}
                          </p>
                        </div>
                        <div className="text-xl font-black text-emerald-600">
                          ${item.price}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-stone-100">
                        <span className="text-xs font-bold text-stone-400 flex items-center gap-2">
                          View Details
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <ChevronRight className="w-5 h-5 text-stone-300" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
