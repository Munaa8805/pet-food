import { Link } from 'react-router-dom';
import { Product } from '../types';
import { motion } from 'motion/react';
import { ShoppingCart, Info, Star, Heart } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isLiked = isInWishlist(product.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="group relative bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="aspect-square overflow-hidden relative">
        <img
          src={product.imageUrl || `https://picsum.photos/seed/${product.name}/800/800`}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4">
          <button 
            onClick={() => toggleWishlist(product.id, 'product')}
            className={`p-2 backdrop-blur-sm rounded-full transition-all shadow-sm ${
              isLiked 
                ? 'bg-rose-500 text-white' 
                : 'bg-white/90 text-stone-600 hover:text-red-500 hover:bg-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>
        {product.isFeatured && (
          <div className="absolute top-4 left-4">
            <div className="px-3 py-1 bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 shadow-lg">
              <Star className="w-3 h-3 fill-current" />
              Featured
            </div>
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl flex justify-between items-center shadow-sm">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 truncate">{product.category}</p>
              <h3 className="text-sm font-bold text-stone-900 truncate">{product.name}</h3>
            </div>
            <div className="text-right ml-2">
              <p className="text-sm font-bold text-emerald-600">${product.price}</p>
              <p className="text-[10px] font-medium text-stone-500 uppercase tracking-tighter">
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 flex gap-2">
        <Link 
          to={`/product/${product.id}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-stone-900 text-white rounded-2xl font-bold text-sm hover:bg-stone-800 transition-colors"
        >
          <Info className="w-4 h-4" />
          Details
        </Link>
        <button 
          disabled={product.stock === 0}
          className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
