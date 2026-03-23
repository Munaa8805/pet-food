import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { User, Mail, Shield, Edit2, Save, X, Camera, ShoppingBag, ChevronRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, profile, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4">
        <h2 className="text-2xl font-black text-stone-900 mb-4">Please sign in to view your profile</h2>
      </div>
    );
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({ displayName });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-20">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] shadow-xl border border-stone-200 overflow-hidden"
        >
          {/* Header/Cover */}
          <div className="h-40 bg-stone-900 relative">
            <div className="absolute -bottom-16 left-12">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[2.5rem] bg-stone-100 border-4 border-white overflow-hidden shadow-xl">
                  <img 
                    src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button className="absolute bottom-2 right-2 p-2 bg-emerald-500 text-white rounded-xl shadow-lg hover:bg-emerald-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-20 pb-12 px-12">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h1 className="text-4xl font-black text-stone-900 tracking-tight mb-2">
                  {profile.displayName || 'Anonymous User'}
                </h1>
                <p className="text-stone-500 font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} Account
                </p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="p-6 bg-stone-50 rounded-[2rem] border border-stone-100">
                  <label className="text-xs font-black text-stone-400 uppercase tracking-widest mb-2 block">Display Name</label>
                  {isEditing ? (
                    <form onSubmit={handleUpdate} className="flex gap-2">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="flex-1 px-4 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
                      >
                        {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setDisplayName(profile.displayName || '');
                        }}
                        className="p-2 bg-stone-200 text-stone-600 rounded-xl hover:bg-stone-300 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </form>
                  ) : (
                    <p className="text-lg font-bold text-stone-900 flex items-center gap-3">
                      <User className="w-5 h-5 text-stone-400" />
                      {profile.displayName || 'Not set'}
                    </p>
                  )}
                </div>

                <div className="p-6 bg-stone-50 rounded-[2rem] border border-stone-100">
                  <label className="text-xs font-black text-stone-400 uppercase tracking-widest mb-2 block">Email Address</label>
                  <p className="text-lg font-bold text-stone-900 flex items-center gap-3">
                    <Mail className="w-5 h-5 text-stone-400" />
                    {profile.email}
                  </p>
                </div>

                <Link 
                  to="/orders"
                  className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center justify-between group hover:bg-emerald-100 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-600">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-emerald-900">My Orders</h3>
                      <p className="text-sm font-bold text-emerald-600">View your purchase history</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link 
                  to="/wishlist"
                  className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100 flex items-center justify-between group hover:bg-rose-100 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-rose-600">
                      <Heart className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-rose-900">My Wishlist</h3>
                      <p className="text-sm font-bold text-rose-600">View your saved items</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-rose-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="space-y-6">
                <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                  <h3 className="text-lg font-black text-emerald-900 mb-2">Member Since</h3>
                  <p className="text-emerald-700 font-bold">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                  <div className="mt-6 pt-6 border-t border-emerald-100">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Account Status</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-sm font-black text-emerald-900 uppercase">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
