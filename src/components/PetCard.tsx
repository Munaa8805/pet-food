import { Link } from 'react-router-dom';
import { Pet } from '../types';
import { motion } from 'motion/react';
import { Heart, Info, Tag } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';

interface PetCardProps {
  pet: Pet;
}

export default function PetCard({ pet }: PetCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isLiked = isInWishlist(pet.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="group relative bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="aspect-[4/5] overflow-hidden relative">
        <img
          src={pet.imageUrl || `https://picsum.photos/seed/${pet.name}/800/1000`}
          alt={pet.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4">
          <button 
            onClick={() => toggleWishlist(pet.id, 'pet')}
            className={`p-2 backdrop-blur-sm rounded-full transition-all shadow-sm ${
              isLiked 
                ? 'bg-rose-500 text-white' 
                : 'bg-white/90 text-stone-600 hover:text-red-500 hover:bg-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl flex justify-between items-center shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{pet.species}</p>
              <h3 className="text-lg font-bold text-stone-900">{pet.name}</h3>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-600">${pet.price}</p>
              <p className="text-[10px] font-medium text-stone-500 uppercase tracking-tighter">{pet.status}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 flex gap-2">
        <Link 
          to={`/pet/${pet.id}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-stone-900 text-white rounded-2xl font-bold text-sm hover:bg-stone-800 transition-colors"
        >
          <Info className="w-4 h-4" />
          Details
        </Link>
        <button className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-colors">
          <Tag className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
