import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { WishlistItem } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

interface WishlistContextType {
  wishlist: WishlistItem[];
  toggleWishlist: (itemId: string, itemType: 'pet' | 'product') => Promise<void>;
  isInWishlist: (itemId: string) => boolean;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWishlist([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'wishlists'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWishlist(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WishlistItem)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'wishlists');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleWishlist = async (itemId: string, itemType: 'pet' | 'product') => {
    if (!user) return;

    const existingItem = wishlist.find(item => item.itemId === itemId);

    try {
      if (existingItem) {
        await deleteDoc(doc(db, 'wishlists', existingItem.id));
      } else {
        await addDoc(collection(db, 'wishlists'), {
          userId: user.uid,
          itemId,
          itemType,
          addedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, existingItem ? OperationType.DELETE : OperationType.CREATE, 'wishlists');
    }
  };

  const isInWishlist = (itemId: string) => {
    return wishlist.some(item => item.itemId === itemId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
