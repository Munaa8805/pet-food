import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Pet, Category, Product } from '../types';
import PetCard from '../components/PetCard';
import ProductCard from '../components/ProductCard';
import HeroBanner from '../components/HeroBanner';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, PawPrint, ShoppingBag, ArrowRight } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Link } from 'react-router-dom';

export default function Home() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const petsPath = 'pets';
    const petsQuery = selectedCategory === 'all' 
      ? query(collection(db, 'pets'), where('status', '==', 'available'), limit(8))
      : query(collection(db, 'pets'), where('category', '==', selectedCategory), where('status', '==', 'available'), limit(8));

    const unsubscribePets = onSnapshot(petsQuery, (snapshot) => {
      const petsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pet));
      setPets(petsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, petsPath);
    });

    const productsPath = 'products';
    const productsQuery = query(collection(db, 'products'), where('isFeatured', '==', true), limit(4));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setFeaturedProducts(productsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, productsPath);
    });

    const categoriesPath = 'categories';
    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(categoriesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, categoriesPath);
    });

    return () => {
      unsubscribePets();
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, [selectedCategory]);

  const filteredPets = pets.filter(pet => 
    pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.species.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <HeroBanner searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Categories & Filters */}
      <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-stone-200">
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 ${
                selectedCategory === 'all' 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <PawPrint className="w-4 h-4" />
              All Pets
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                  selectedCategory === category.id 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pet Grid */}
      <main className="max-w-7xl mx-auto px-4 mt-16">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black text-stone-900 tracking-tight">Available Pets</h2>
            <p className="text-stone-500 font-medium">Showing {filteredPets.length} companions ready for a home</p>
          </div>
          <Link to="/" className="hidden sm:flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-widest hover:gap-3 transition-all">
            View All Pets
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl h-[400px] animate-pulse border border-stone-200" />
            ))}
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredPets.map(pet => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && filteredPets.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex p-6 bg-stone-100 rounded-full mb-4">
              <PawPrint className="w-12 h-12 text-stone-300" />
            </div>
            <h3 className="text-xl font-bold text-stone-900">No pets found</h3>
            <p className="text-stone-500">Try adjusting your search or category filters.</p>
          </div>
        )}

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <section className="mt-32">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-black text-stone-900 tracking-tight">Featured Supplies</h2>
                <p className="text-stone-500 font-medium">Premium items for your furry friends</p>
              </div>
              <Link to="/products" className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-widest hover:gap-3 transition-all">
                Shop All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Success Stories Slider */}
      <section className="py-24 bg-stone-900 overflow-hidden mt-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white tracking-tight mb-4">Happy Tails</h2>
            <p className="text-stone-400 font-medium max-w-2xl mx-auto">
              Real stories from families who found their perfect companion at Pawfect.
            </p>
          </div>

          <div className="relative">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {[
                {
                  name: "The Miller Family",
                  pet: "Buddy",
                  story: "Buddy has brought so much joy to our home. He's the perfect addition to our family!",
                  image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800"
                },
                {
                  name: "Sarah & Luna",
                  pet: "Luna",
                  story: "Luna is the sweetest cat. She's so affectionate and loves to cuddle all day.",
                  image: "https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&q=80&w=800"
                },
                {
                  name: "James & Charlie",
                  pet: "Charlie",
                  story: "Charlie is so smart and funny. He's always making us laugh with his antics.",
                  image: "https://images.unsplash.com/photo-1522926193341-e9fed19c7dfc?auto=format&fit=crop&q=80&w=800"
                }
              ].map((story, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <PawPrint className="w-24 h-24 text-white" />
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <img 
                      src={story.image} 
                      alt={story.name} 
                      className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-white font-bold">{story.name}</h4>
                      <p className="text-emerald-400 text-sm font-medium">Adopted {story.pet}</p>
                    </div>
                  </div>
                  <p className="text-stone-300 italic leading-relaxed">
                    "{story.story}"
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
