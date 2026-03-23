import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WishlistProvider } from './contexts/WishlistContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import PetDetail from './pages/PetDetail';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import Admin from './pages/Admin';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <Router>
          <div className="min-h-screen bg-stone-50 font-sans selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
            <Navbar />
            <div className="flex-grow">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/pet/:id" element={<PetDetail />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/admin" element={<Admin />} />
                </Routes>
              </AnimatePresence>
            </div>
            <Footer />
          </div>
        </Router>
      </WishlistProvider>
    </AuthProvider>
  );
}
