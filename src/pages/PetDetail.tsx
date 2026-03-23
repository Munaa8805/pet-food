import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Pet } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Calendar, 
  Tag, 
  MapPin, 
  ShieldCheck, 
  PawPrint,
  CheckCircle2
} from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

export default function PetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [activeImage, setActiveImage] = useState<string>('');

  const isWishlisted = id ? isInWishlist(id) : false;

  useEffect(() => {
    if (!id) return;
    const path = `pets/${id}`;
    const fetchPet = async () => {
      try {
        const docRef = doc(db, 'pets', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Pet;
          setPet({ id: docSnap.id, ...data } as Pet);
          setActiveImage(data.imageUrl || `https://picsum.photos/seed/${data.name}/1200/1200`);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      } finally {
        setLoading(false);
      }
    };
    fetchPet();
  }, [id]);

  const handleToggleWishlist = async () => {
    if (!user) {
      await login();
      return;
    }
    if (!id) return;
    await toggleWishlist(id, 'pet');
  };

  const handleAdopt = async () => {
    if (!user) {
      await login();
      return;
    }
    if (!pet) return;

    setOrdering(true);
    const path = 'orders';
    try {
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        petId: pet.id,
        status: 'pending',
        totalPrice: pet.price,
        createdAt: new Date().toISOString(),
      });
      setOrdered(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!pet) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
      <h2 className="text-2xl font-bold text-stone-900">Pet not found</h2>
      <button onClick={() => navigate('/')} className="mt-4 text-emerald-600 font-bold">Back to Home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-900 font-bold text-sm uppercase tracking-widest transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listings
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
              <img 
                src={activeImage} 
                alt={pet.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                pet.imageUrl || `https://picsum.photos/seed/${pet.name}/1200/1200`,
                `https://picsum.photos/seed/${pet.name}-1/1200/1200`,
                `https://picsum.photos/seed/${pet.name}-2/1200/1200`,
                `https://picsum.photos/seed/${pet.name}-3/1200/1200`
              ].map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`aspect-square rounded-3xl bg-white border-2 transition-all overflow-hidden ${
                    activeImage === img ? 'border-emerald-500 scale-105 shadow-lg' : 'border-stone-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`${pet.name} view ${i + 1}`} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Content Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-widest rounded-full">
                    {pet.species}
                  </span>
                  <span className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-black uppercase tracking-widest rounded-full">
                    {pet.status}
                  </span>
                </div>
                <h1 className="text-5xl font-black text-stone-900 tracking-tight">{pet.name}</h1>
                <p className="text-xl text-stone-500 font-medium mt-1">{pet.breed}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleToggleWishlist}
                  className={`p-4 rounded-2xl border transition-all ${
                    isWishlisted 
                      ? 'bg-rose-50 border-rose-200 text-rose-600' 
                      : 'bg-white border-stone-200 text-stone-600 hover:text-rose-500 hover:bg-rose-50'
                  }`}
                  title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
                <button className="p-4 bg-white border border-stone-200 rounded-2xl text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                  <Share2 className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-4 rounded-3xl border border-stone-200 text-center">
                <Calendar className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-stone-400 uppercase tracking-tighter">Age</p>
                <p className="text-lg font-black text-stone-900">{pet.age} Years</p>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-stone-200 text-center">
                <Tag className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-stone-400 uppercase tracking-tighter">Price</p>
                <p className="text-lg font-black text-stone-900">${pet.price}</p>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-stone-200 text-center">
                <MapPin className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-stone-400 uppercase tracking-tighter">Location</p>
                <p className="text-lg font-black text-stone-900">Shelter A</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 mb-8">
              <h3 className="text-xl font-black text-stone-900 mb-4">About {pet.name}</h3>
              <p className="text-stone-600 leading-relaxed font-medium">
                {pet.description || `${pet.name} is a wonderful ${pet.breed} looking for a loving home. They are very friendly, active, and would make a great addition to any family.`}
              </p>
            </div>

            <div className="space-y-4 mt-auto">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">Health Guaranteed</p>
                  <p className="text-xs text-emerald-600 font-medium">Fully vaccinated and health checked by our vets.</p>
                </div>
              </div>

              {ordered ? (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full py-6 bg-emerald-500 text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-8 h-8" />
                  Adoption Pending!
                </motion.div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAdopt}
                  disabled={ordering || pet.status !== 'available'}
                  className="w-full py-6 bg-stone-900 text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ordering ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <PawPrint className="w-6 h-6" />
                      {pet.status === 'available' ? 'Adopt Now' : 'Not Available'}
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
