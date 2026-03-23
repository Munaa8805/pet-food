import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, query, where, getDocs, deleteDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Review } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Share2, 
  Tag, 
  ShieldCheck, 
  CheckCircle2,
  Star,
  Package,
  Heart,
  MessageSquare,
  Send,
  User as UserIcon
} from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [activeImage, setActiveImage] = useState<string>('');
  
  // Review states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const isWishlisted = id ? isInWishlist(id) : false;

  useEffect(() => {
    if (!id) return;
    const path = `products/${id}`;
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Product;
          setProduct({ id: docSnap.id, ...data } as Product);
          setActiveImage(data.imageUrl || `https://picsum.photos/seed/${data.name}/1200/1200`);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();

    // Listen for reviews
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(reviewsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
    });

    return () => unsubscribe();
  }, [id]);

  const handleToggleWishlist = async () => {
    if (!user) {
      await login();
      return;
    }
    if (!id) return;
    await toggleWishlist(id, 'product');
  };

  const handleBuy = async () => {
    if (!user) {
      await login();
      return;
    }
    if (!product) return;

    setOrdering(true);
    const path = 'orders';
    try {
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        productId: product.id,
        status: 'pending',
        totalPrice: product.price,
        createdAt: new Date().toISOString(),
      });
      setOrdered(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setOrdering(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      await login();
      return;
    }
    if (!id || !comment.trim()) return;

    setSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString()
      });
      setComment('');
      setRating(5);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4">
        <h2 className="text-2xl font-black text-stone-900 mb-4">Product not found</h2>
        <button 
          onClick={() => navigate('/products')}
          className="px-6 py-3 bg-stone-900 text-white rounded-2xl font-bold"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-500 font-bold hover:text-stone-900 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-20">
          {/* Image Gallery */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="relative rounded-[3rem] overflow-hidden bg-white shadow-2xl border border-stone-200">
              <img 
                src={activeImage}
                alt={product.name}
                className="w-full aspect-square object-cover"
                referrerPolicy="no-referrer"
              />
              {product.isFeatured && (
                <div className="absolute top-8 left-8">
                  <div className="px-4 py-2 bg-amber-400 text-amber-950 text-xs font-black uppercase tracking-widest rounded-full flex items-center gap-2 shadow-xl">
                    <Star className="w-4 h-4 fill-current" />
                    Featured Product
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4">
              {[
                product.imageUrl || `https://picsum.photos/seed/${product.name}/1200/1200`,
                `https://picsum.photos/seed/${product.name}-1/1200/1200`,
                `https://picsum.photos/seed/${product.name}-2/1200/1200`,
                `https://picsum.photos/seed/${product.name}-3/1200/1200`
              ].map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                    activeImage === img ? 'border-emerald-500 scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`${product.name} view ${i + 1}`} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                    {product.category}
                  </span>
                  <span className="px-3 py-1 bg-stone-100 text-stone-600 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {product.stock} in stock
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tight leading-tight">
                  {product.name}
                </h1>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleToggleWishlist}
                  className={`p-4 rounded-3xl border transition-all shadow-sm ${
                    isWishlisted 
                      ? 'bg-rose-50 border-rose-200 text-rose-600' 
                      : 'bg-white border-stone-200 text-stone-400 hover:text-rose-500 hover:bg-rose-50'
                  }`}
                  title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
                <button className="p-4 bg-white rounded-3xl border border-stone-200 text-stone-400 hover:text-emerald-500 transition-all shadow-sm">
                  <Share2 className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="text-3xl font-black text-emerald-600">${product.price}</div>
              <div className="h-8 w-px bg-stone-200" />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < Math.round(averageRating) ? 'fill-current' : 'text-stone-200'}`} 
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-stone-400">({reviews.length} reviews)</span>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm mb-8">
              <h3 className="text-lg font-black text-stone-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-500" />
                Product Description
              </h3>
              <p className="text-stone-600 leading-relaxed font-medium">
                {product.description || "No description available for this product."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-stone-100 rounded-3xl flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <div className="text-xs font-bold text-stone-900 uppercase tracking-wider">Quality Guaranteed</div>
              </div>
              <div className="p-4 bg-stone-100 rounded-3xl flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <div className="text-xs font-bold text-stone-900 uppercase tracking-wider">Fast Shipping</div>
              </div>
            </div>

            <button
              onClick={handleBuy}
              disabled={ordering || ordered || product.stock === 0}
              className={`w-full py-6 rounded-[2rem] font-black text-xl transition-all flex items-center justify-center gap-3 shadow-2xl ${
                ordered 
                ? 'bg-emerald-500 text-white' 
                : product.stock === 0
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-stone-900 text-white hover:bg-stone-800 hover:scale-[1.02] active:scale-95'
              }`}
            >
              {ordering ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : ordered ? (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  Order Placed!
                </>
              ) : product.stock === 0 ? (
                'Out of Stock'
              ) : (
                <>
                  <ShoppingCart className="w-6 h-6" />
                  Add to Cart
                </>
              )}
            </button>
            
            {ordered && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mt-4 text-emerald-600 font-bold"
              >
                Thank you! We'll process your order shortly.
              </motion.p>
            )}
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-8">
              <div>
                <h2 className="text-3xl font-black text-stone-900 mb-2">Customer Reviews</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-6 h-6 ${i < Math.round(averageRating) ? 'fill-current' : 'text-stone-200'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-xl font-black text-stone-900">{averageRating.toFixed(1)}</span>
                  <span className="text-stone-400 font-bold">based on {reviews.length} reviews</span>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm">
                <h3 className="text-lg font-black text-stone-900 mb-6 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                  Write a Review
                </h3>
                {user ? (
                  <form onSubmit={handleSubmitReview} className="space-y-6">
                    <div>
                      <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-3">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`p-2 rounded-xl transition-all ${
                              rating >= star ? 'text-amber-400' : 'text-stone-200 hover:text-amber-200'
                            }`}
                          >
                            <Star className={`w-6 h-6 ${rating >= star ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-3">Your Comment</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience with this product..."
                        className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-h-[120px] resize-none"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReview || !comment.trim()}
                      className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-stone-800 transition-all disabled:opacity-50"
                    >
                      {submittingReview ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Review
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-stone-500 font-medium mb-4">Please log in to share your review.</p>
                    <button 
                      onClick={login}
                      className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all"
                    >
                      Log In
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="popLayout">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-stone-900">{review.userName}</h4>
                          <p className="text-xs text-stone-400 font-bold">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-stone-100'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-stone-600 leading-relaxed font-medium italic">
                      "{review.comment}"
                    </p>
                  </motion.div>
                ))
              ) : (
                <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-stone-300 text-center">
                  <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-stone-200" />
                  </div>
                  <h3 className="text-lg font-black text-stone-900">No reviews yet</h3>
                  <p className="text-stone-500">Be the first to share your thoughts!</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
