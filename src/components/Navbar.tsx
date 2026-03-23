import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, User, LogOut, LayoutDashboard, PawPrint, ShoppingBag, Heart } from 'lucide-react';
import { motion } from 'motion/react';

export default function Navbar() {
  const { user, profile, logout, login, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
              <PawPrint className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xl font-bold tracking-tight text-stone-900">Pawfect</span>
          </Link>

          <div className="flex items-center gap-8">
            <Link to="/" className="text-sm font-bold text-stone-600 hover:text-emerald-600 transition-colors">Find a Pet</Link>
            <Link to="/products" className="text-sm font-bold text-stone-600 hover:text-emerald-600 transition-colors">Shop Supplies</Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link 
                  to="/wishlist" 
                  className="p-2 text-stone-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  title="My Wishlist"
                >
                  <Heart className="w-5 h-5" />
                </Link>
                <Link 
                  to="/orders" 
                  className="p-2 text-stone-600 hover:text-emerald-600 hover:bg-stone-50 rounded-lg transition-all"
                  title="My Orders"
                >
                  <ShoppingBag className="w-5 h-5" />
                </Link>
                <Link 
                  to="/profile" 
                  className="p-2 text-stone-600 hover:text-emerald-600 hover:bg-stone-50 rounded-lg transition-all"
                  title="Profile"
                >
                  <User className="w-5 h-5" />
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="p-2 text-stone-600 hover:text-emerald-600 hover:bg-stone-50 rounded-lg transition-all"
                    title="Admin Dashboard"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                  </Link>
                )}
                <div className="flex items-center gap-3 pl-4 border-l border-stone-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-stone-900">{profile?.displayName}</p>
                    <p className="text-xs text-stone-500 capitalize">{profile?.role}</p>
                  </div>
                  <button 
                    onClick={() => logout()}
                    className="p-2 text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => login()}
                className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors"
              >
                <User className="w-4 h-4" />
                Sign In
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
