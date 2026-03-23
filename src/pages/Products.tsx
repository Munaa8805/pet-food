import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ShoppingBag, Sparkles } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const productsPath = 'products';
    const productsQuery = selectedCategory === 'all' 
      ? query(collection(db, 'products'))
      : query(collection(db, 'products'), where('category', '==', selectedCategory));

    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);
      setLoading(false);
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
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, [selectedCategory]);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Hero Section */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden bg-stone-900">
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=2000" 
            alt="Products Hero" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-bold mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Premium Pet Supplies
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight"
          >
            Everything Your <br />
            <span className="text-emerald-400 italic font-serif">Pawfect</span> Pet Needs
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input 
                type="text"
                placeholder="Search for toys, food, accessories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xl"
              />
            </div>
          </motion.div>
        </div>
      </section>

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
              <ShoppingBag className="w-4 h-4" />
              All Products
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

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto px-4 mt-16">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black text-stone-900 tracking-tight">Pet Supplies</h2>
            <p className="text-stone-500 font-medium">Showing {filteredProducts.length} items for your pet</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-stone-400 font-bold text-sm uppercase tracking-widest">
            <Filter className="w-4 h-4" />
            Sort by: Featured
          </div>
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
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex p-6 bg-stone-100 rounded-full mb-4">
              <ShoppingBag className="w-12 h-12 text-stone-300" />
            </div>
            <h3 className="text-xl font-bold text-stone-900">No products found</h3>
            <p className="text-stone-500">Try adjusting your search or category filters.</p>
          </div>
        )}
      </main>
    </div>
  );
}
