import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Pet, Category, Order, UserProfile, Product, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  LayoutGrid, 
  PawPrint, 
  ShoppingCart, 
  Users, 
  User,
  LayoutDashboard,
  Save, 
  X,
  ShoppingBag,
  Image as ImageIcon,
  Database,
  Loader2,
  Search
} from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { writeBatch } from 'firebase/firestore';
import ConfirmModal from '../components/ConfirmModal';

export default function Admin() {
  const { isAdmin, user: currentUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pets' | 'categories' | 'orders' | 'users' | 'products'>('dashboard');
  const [pets, setPets] = useState<Pet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [editingPet, setEditingPet] = useState<Partial<Pet> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDanger: true
  });

  const filteredPets = pets.filter(pet => 
    pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.species.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(order => {
    const user = users.find(u => u.uid === order.userId);
    const pet = pets.find(p => p.id === order.petId);
    const product = products.find(p => p.id === order.productId);
    const searchLower = searchQuery.toLowerCase();
    
    return (
      order.id.toLowerCase().includes(searchLower) ||
      user?.displayName.toLowerCase().includes(searchLower) ||
      user?.email.toLowerCase().includes(searchLower) ||
      pet?.name.toLowerCase().includes(searchLower) ||
      product?.name.toLowerCase().includes(searchLower) ||
      order.status.toLowerCase().includes(searchLower)
    );
  });

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalPets: pets.length,
    totalProducts: products.length,
    totalOrders: orders.length,
    totalRevenue: orders.filter(o => o.status === 'completed').reduce((acc, o) => acc + o.totalPrice, 0),
    pendingOrders: orders.filter(o => o.status === 'pending').length
  };

  useEffect(() => {
    if (!isAdmin) return;

    const unsubPets = onSnapshot(query(collection(db, 'pets'), orderBy('name')), (snap) => {
      setPets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Pet)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'pets'));

    const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('name')), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    const unsubCats = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories'));

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    return () => {
      unsubPets();
      unsubProducts();
      unsubCats();
      unsubOrders();
      unsubUsers();
    };
  }, [isAdmin]);

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPet) return;

    try {
      if (editingPet.id) {
        const { id, ...data } = editingPet;
        await updateDoc(doc(db, 'pets', id), data);
      } else {
        await addDoc(collection(db, 'pets'), {
          ...editingPet,
          status: editingPet.status || 'available',
        });
      }
      setIsModalOpen(false);
      setEditingPet(null);
    } catch (error) {
      handleFirestoreError(error, editingPet.id ? OperationType.UPDATE : OperationType.CREATE, editingPet.id ? `pets/${editingPet.id}` : 'pets');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      if (editingProduct.id) {
        const { id, ...data } = editingProduct;
        await updateDoc(doc(db, 'products', id), data);
      } else {
        await addDoc(collection(db, 'products'), {
          ...editingProduct,
          isFeatured: editingProduct.isFeatured || false,
          stock: editingProduct.stock || 0,
        });
      }
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      handleFirestoreError(error, editingProduct.id ? OperationType.UPDATE : OperationType.CREATE, editingProduct.id ? `products/${editingProduct.id}` : 'products');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      if (editingCategory.id) {
        const { id, ...data } = editingCategory;
        await updateDoc(doc(db, 'categories', id), data);
      } else {
        await addDoc(collection(db, 'categories'), editingCategory);
      }
      setIsModalOpen(false);
      setEditingCategory(null);
    } catch (error) {
      handleFirestoreError(error, editingCategory.id ? OperationType.UPDATE : OperationType.CREATE, editingCategory.id ? `categories/${editingCategory.id}` : 'categories');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleDeletePet = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Pet',
      message: 'Are you sure you want to delete this pet? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'pets', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `pets/${id}`);
        }
      },
      isDanger: true
    });
  };

  const handleDeleteProduct = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'products', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
        }
      },
      isDanger: true
    });
  };

  const handleDeleteCategory = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'categories', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
        }
      },
      isDanger: true
    });
  };

  const handleSeedDatabase = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Seed Database',
      message: 'This will add sample categories, pets, and products to your database. Continue?',
      onConfirm: async () => {
        setIsSeeding(true);
        setSeedStatus(null);
        try {
          const batch = writeBatch(db);
          // ... rest of the seeding logic

      // 1. Seed Categories
      const categoriesToSeed = [
        { name: 'Dogs', icon: 'dog' },
        { name: 'Cats', icon: 'cat' },
        { name: 'Birds', icon: 'bird' },
        { name: 'Small Animals', icon: 'rabbit' },
        { name: 'Supplies', icon: 'shopping-bag' }
      ];

      const catRefs = categoriesToSeed.map(cat => {
        const ref = doc(collection(db, 'categories'));
        batch.set(ref, cat);
        return { ...cat, id: ref.id };
      });

      // 2. Seed Pets
      const petsData = [
        {
          name: 'Buddy',
          species: 'Dog',
          breed: 'Golden Retriever',
          age: 2,
          price: 500,
          description: 'A friendly and energetic Golden Retriever looking for a loving home.',
          imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800',
          status: 'available',
          category: catRefs.find(c => c.name === 'Dogs')?.id || ''
        },
        {
          name: 'Max',
          species: 'Dog',
          breed: 'Labrador',
          age: 1,
          price: 450,
          description: 'Playful Labrador puppy who loves water and playing fetch.',
          imageUrl: 'https://images.unsplash.com/photo-1591769225440-811ad7d62ca2?auto=format&fit=crop&q=80&w=800',
          status: 'available',
          category: catRefs.find(c => c.name === 'Dogs')?.id || ''
        },
        {
          name: 'Bella',
          species: 'Dog',
          breed: 'Beagle',
          age: 3,
          price: 350,
          description: 'Sweet-natured Beagle with a great sense of smell and a gentle heart.',
          imageUrl: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=800',
          status: 'available',
          category: catRefs.find(c => c.name === 'Dogs')?.id || ''
        },
        {
          name: 'Luna',
          species: 'Cat',
          breed: 'Siamese',
          age: 1,
          price: 300,
          description: 'Graceful Siamese cat with beautiful blue eyes.',
          imageUrl: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&q=80&w=800',
          status: 'available',
          category: catRefs.find(c => c.name === 'Cats')?.id || ''
        },
        {
          name: 'Oliver',
          species: 'Cat',
          breed: 'Maine Coon',
          age: 2,
          price: 600,
          description: 'Large, fluffy Maine Coon with a majestic appearance and friendly personality.',
          imageUrl: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=800',
          status: 'available',
          category: catRefs.find(c => c.name === 'Cats')?.id || ''
        },
        {
          name: 'Chloe',
          species: 'Cat',
          breed: 'Persian',
          age: 4,
          price: 400,
          description: 'Elegant Persian cat who enjoys quiet afternoons and gentle grooming.',
          imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800',
          status: 'available',
          category: catRefs.find(c => c.name === 'Cats')?.id || ''
        },
        {
          name: 'Charlie',
          species: 'Bird',
          breed: 'Parrot',
          age: 3,
          price: 150,
          description: 'Colorful parrot that loves to talk and whistle.',
          imageUrl: 'https://images.unsplash.com/photo-1522926193341-e9fed19c7dfc?auto=format&fit=crop&q=80&w=800',
          status: 'available',
          category: catRefs.find(c => c.name === 'Birds')?.id || ''
        },
        {
          name: 'Kiwi',
          species: 'Bird',
          breed: 'Budgie',
          age: 1,
          price: 40,
          description: 'Cheerful little budgie that brightens up any room with its chirping.',
          imageUrl: 'https://images.unsplash.com/photo-1552728089-57bdde30eba3?auto=format&fit=crop&q=80&w=800',
          status: 'available',
          category: catRefs.find(c => c.name === 'Birds')?.id || ''
        },
        {
          name: 'Sunny',
          species: 'Bird',
          breed: 'Cockatiel',
          age: 2,
          price: 80,
          description: 'Friendly cockatiel with distinctive orange cheeks and a crest.',
          imageUrl: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&q=80&w=800',
          status: 'available',
          category: catRefs.find(c => c.name === 'Birds')?.id || ''
        },
        {
          name: 'Thumper',
          species: 'Small Animal',
          breed: 'Holland Lop Rabbit',
          age: 1,
          price: 60,
          description: 'Adorable Holland Lop rabbit with floppy ears and a soft coat.',
          imageUrl: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=800',
          status: 'available',
          category: catRefs.find(c => c.name === 'Small Animals')?.id || ''
        },
        {
          name: 'Pip',
          species: 'Small Animal',
          breed: 'Syrian Hamster',
          age: 0.5,
          price: 15,
          description: 'Active Syrian hamster that loves running on its wheel and burrowing.',
          imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=800',
          status: 'available',
          category: catRefs.find(c => c.name === 'Small Animals')?.id || ''
        }
      ];

      petsData.forEach(pet => {
        const ref = doc(collection(db, 'pets'));
        batch.set(ref, pet);
      });

      // 3. Seed Products
      const productsData = [
        // Dog Products
        { name: 'Premium Dog Kibble', price: 55, description: 'High-protein grain-free formula for active dogs.', imageUrl: 'https://images.unsplash.com/photo-1589924691106-073b19f5538d?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Dogs')?.id || 'Dogs', isFeatured: true, stock: 45 },
        { name: 'Heavy Duty Harness', price: 35, description: 'Reflective and padded harness for safe walks.', imageUrl: 'https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Dogs')?.id || 'Dogs', isFeatured: false, stock: 30 },
        { name: 'Interactive Treat Dispenser', price: 22, description: 'Keeps your dog mentally stimulated while they snack.', imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Dogs')?.id || 'Dogs', isFeatured: true, stock: 25 },
        
        // Cat Products
        { name: 'Multi-Level Cat Tree', price: 145, description: '60-inch tower with scratching posts and cozy hammocks.', imageUrl: 'https://images.unsplash.com/photo-1548546738-8509cb246ed3?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Cats')?.id || 'Cats', isFeatured: true, stock: 8 },
        { name: 'Self-Cleaning Litter Box', price: 350, description: 'Never scoop again with this advanced rotating litter box.', imageUrl: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Cats')?.id || 'Cats', isFeatured: true, stock: 5 },
        { name: 'Window Perch for Cats', price: 28, description: 'Suction-cup mounted bed for the perfect sunbathing spot.', imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Cats')?.id || 'Cats', isFeatured: false, stock: 20 },
        
        // Bird Products
        { name: 'Large Flight Cage', price: 180, description: 'Spacious cage allowing birds to fly and exercise.', imageUrl: 'https://images.unsplash.com/photo-1552728089-57bdde30eba3?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Birds')?.id || 'Birds', isFeatured: true, stock: 12 },
        { name: 'Premium Bird Seed Mix', price: 15, description: 'Nutrient-rich blend of seeds and dried fruits.', imageUrl: 'https://images.unsplash.com/photo-1522926193341-e9fed19c7dfc?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Birds')?.id || 'Birds', isFeatured: false, stock: 100 },
        { name: 'Bird Swing with Bells', price: 12, description: 'Colorful wooden swing to keep your bird entertained.', imageUrl: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Birds')?.id || 'Birds', isFeatured: false, stock: 50 },
        
        // Small Animal Products
        { name: 'Timothy Hay (Large Bag)', price: 20, description: 'High-quality hay essential for rabbits and guinea pigs.', imageUrl: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Small Animals')?.id || 'Small Animals', isFeatured: true, stock: 60 },
        { name: 'Silent Exercise Wheel', price: 18, description: 'Quiet spinning wheel for hamsters and hedgehogs.', imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Small Animals')?.id || 'Small Animals', isFeatured: false, stock: 40 },
        { name: 'Chewable Hideout', price: 14, description: 'Natural wood house that is safe for small animals to chew.', imageUrl: 'https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Small Animals')?.id || 'Small Animals', isFeatured: false, stock: 35 },

        // General Supplies
        { name: 'Organic Catnip Mice', price: 12, description: 'Set of 3 mice filled with premium organic catnip.', imageUrl: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Supplies')?.id || 'Supplies', isFeatured: false, stock: 120 },
        { name: 'Orthopedic Memory Foam Bed', price: 85, description: 'Ultimate comfort for senior pets with joint pain.', imageUrl: 'https://images.unsplash.com/photo-1541599540903-216a46ca1df0?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Supplies')?.id || 'Supplies', isFeatured: true, stock: 15 },
        { name: 'Automatic Pet Feeder', price: 120, description: 'Programmable feeder with smartphone integration.', imageUrl: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Supplies')?.id || 'Supplies', isFeatured: true, stock: 10 },
        { name: 'Retractable Leash (5m)', price: 25, description: 'Durable leash with ergonomic handle and locking mechanism.', imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Supplies')?.id || 'Supplies', isFeatured: false, stock: 60 },
        { name: 'Interactive Laser Toy', price: 18, description: 'Automated laser patterns to keep your cat active.', imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Supplies')?.id || 'Supplies', isFeatured: false, stock: 85 },
        { name: 'Grooming Deshedding Tool', price: 30, description: 'Reduces shedding by up to 90% for long-haired breeds.', imageUrl: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Supplies')?.id || 'Supplies', isFeatured: false, stock: 40 },
        { name: 'Natural Pet Shampoo', price: 15, description: 'Hypoallergenic oatmeal formula for sensitive skin.', imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Supplies')?.id || 'Supplies', isFeatured: false, stock: 100 },
        { name: 'Dental Chew Sticks (30pk)', price: 22, description: 'Helps reduce plaque and tartar buildup while freshening breath.', imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Supplies')?.id || 'Supplies', isFeatured: true, stock: 200 },
        { name: 'Travel Pet Carrier', price: 50, description: 'Airline-approved soft-sided carrier for small pets.', imageUrl: 'https://images.unsplash.com/photo-1591768793355-74d7c836038c?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Supplies')?.id || 'Supplies', isFeatured: false, stock: 25 },
        { name: 'Water Fountain (2L)', price: 35, description: 'Triple-action filtration system for fresh flowing water.', imageUrl: 'https://images.unsplash.com/photo-1590634308263-9ef497838995?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Supplies')?.id || 'Supplies', isFeatured: false, stock: 30 },
        { name: 'Winter Puffer Vest', price: 40, description: 'Waterproof and insulated coat for cold weather walks.', imageUrl: 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Supplies')?.id || 'Supplies', isFeatured: false, stock: 40 },
        { name: 'Slow Feeder Bowl', price: 14, description: 'Prevents bloating by slowing down fast eaters.', imageUrl: 'https://images.unsplash.com/photo-1591769225440-811ad7d62ca2?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Supplies')?.id || 'Supplies', isFeatured: false, stock: 75 },
        { name: 'Calming Hemp Treats', price: 28, description: 'Helps reduce anxiety during storms or travel.', imageUrl: 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Supplies')?.id || 'Supplies', isFeatured: false, stock: 90 },
        { name: 'Squeaky Plush Toy Set', price: 20, description: '5-pack of durable plush toys for small to medium dogs.', imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Supplies')?.id || 'Supplies', isFeatured: false, stock: 150 },
        { name: 'LED Safety Collar', price: 16, description: 'USB rechargeable collar for high visibility at night.', imageUrl: 'https://images.unsplash.com/photo-1591768793355-74d7c836038c?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Supplies')?.id || 'Supplies', isFeatured: false, stock: 110 },
        { name: 'Cooling Gel Mat', price: 32, description: 'Pressure-activated gel mat to keep pets cool in summer.', imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Supplies')?.id || 'Supplies', isFeatured: false, stock: 35 },
        { name: 'Pet First Aid Kit', price: 45, description: 'Comprehensive 50-piece kit for emergency situations.', imageUrl: 'https://images.unsplash.com/photo-1584308919139-332c34f2428f?auto=format&fit=crop&q=80&w=800', category: catRefs.find(c => c.name === 'Supplies')?.id || 'Supplies', isFeatured: true, stock: 20 }
      ];

      productsData.forEach(product => {
        const ref = doc(collection(db, 'products'));
        batch.set(ref, product);
      });

      await batch.commit();
      setSeedStatus({ type: 'success', message: 'Database seeded successfully!' });
      setTimeout(() => setSeedStatus(null), 5000);
    } catch (error) {
      console.error('Error seeding database:', error);
      setSeedStatus({ type: 'error', message: 'Failed to seed database. Check permissions.' });
      setTimeout(() => setSeedStatus(null), 5000);
    } finally {
      setIsSeeding(false);
    }
  },
  isDanger: false
});
};

  if (authLoading) return null;
  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <h2 className="text-2xl font-bold text-stone-900">Access Denied</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-12">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black text-stone-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-stone-500 font-medium">Manage your pet store inventory and orders</p>
          </div>
          <div className="flex flex-col items-end gap-4">
            {seedStatus && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${
                  seedStatus.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {seedStatus.message}
              </motion.div>
            )}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === 'dashboard' ? 'everything' : activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 pr-12 py-3 bg-white border border-stone-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all w-64 shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <X className="w-3 h-3 text-stone-400" />
                  </button>
                )}
              </div>
              <button
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="flex items-center gap-2 px-4 py-2 bg-stone-200 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-300 transition-all disabled:opacity-50"
              >
                {isSeeding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                Seed Sample Data
              </button>
            </div>
            <div className="flex bg-white p-1 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
              {[
                { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
                { id: 'pets', icon: PawPrint, label: 'Pets' },
                { id: 'products', icon: ShoppingBag, label: 'Products' },
                { id: 'categories', icon: LayoutGrid, label: 'Categories' },
                { id: 'orders', icon: ShoppingCart, label: 'Orders' },
                { id: 'users', icon: Users, label: 'Users' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                    ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/20' 
                    : 'text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Revenue', value: `$${stats.totalRevenue}`, icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Total Pets', value: stats.totalPets, icon: PawPrint, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Total Products', value: stats.totalProducts, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm">
                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-black text-stone-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-3xl font-black text-stone-900">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm">
                  <h3 className="text-xl font-black text-stone-900 mb-6">Recent Orders</h3>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-stone-200">
                            <ShoppingCart className="w-5 h-5 text-stone-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-stone-900">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-xs text-stone-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm">
                  <h3 className="text-xl font-black text-stone-900 mb-6">Inventory Status</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="text-stone-500">Pets Available</span>
                        <span className="text-stone-900">{pets.filter(p => p.status === 'available').length} / {pets.length}</span>
                      </div>
                      <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-1000" 
                          style={{ width: `${(pets.filter(p => p.status === 'available').length / pets.length) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="text-stone-500">Products in Stock</span>
                        <span className="text-stone-900">{products.filter(p => p.stock > 0).length} / {products.length}</span>
                      </div>
                      <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-1000" 
                          style={{ width: `${(products.filter(p => p.stock > 0).length / products.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'pets' && (
            <motion.div
              key="pets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-stone-900">Pet Inventory ({filteredPets.length})</h2>
                <button 
                  onClick={() => {
                    setEditingPet({});
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-5 h-5" />
                  Add New Pet
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPets.length > 0 ? (
                  filteredPets.map(pet => (
                    <div key={pet.id} className="bg-white p-6 rounded-[2rem] border border-stone-200 shadow-sm flex gap-4">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-stone-100 flex-shrink-0">
                        <img src={pet.imageUrl} alt={pet.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-stone-900 truncate">{pet.name}</h3>
                        <p className="text-sm text-stone-500 font-medium">{pet.breed}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            pet.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
                          }`}>
                            {pet.status}
                          </span>
                          <span className="text-sm font-bold text-stone-900">${pet.price}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => {
                            setEditingPet(pet);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeletePet(pet.id)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-stone-300" />
                    </div>
                    <h3 className="text-lg font-black text-stone-900">No pets found</h3>
                    <p className="text-stone-500">Try adjusting your search query</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-stone-900">Product Inventory ({filteredProducts.length})</h2>
                <button 
                  onClick={() => {
                    setEditingProduct({});
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-5 h-5" />
                  Add New Product
                </button>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="px-8 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Product</th>
                        <th className="px-8 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Category</th>
                        <th className="px-8 py-4 text-xs font-black text-stone-400 uppercase tracking-widest text-center">Price</th>
                        <th className="px-8 py-4 text-xs font-black text-stone-400 uppercase tracking-widest text-center">Stock</th>
                        <th className="px-8 py-4 text-xs font-black text-stone-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                          <tr key={product.id} className="hover:bg-stone-50 transition-colors">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200">
                                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-stone-900">{product.name}</p>
                                  {product.isFeatured && (
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Featured</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-sm text-stone-500 font-medium">{product.category}</td>
                            <td className="px-8 py-6 text-sm font-bold text-stone-900 text-center">${product.price}</td>
                            <td className="px-8 py-6">
                              <div className="flex items-center justify-center gap-3">
                                <div className="relative group">
                                  <input
                                    type="number"
                                    min="0"
                                    value={product.stock}
                                    onChange={async (e) => {
                                      const newStock = parseInt(e.target.value);
                                      if (isNaN(newStock)) return;
                                      try {
                                        await updateDoc(doc(db, 'products', product.id), { stock: newStock });
                                      } catch (error) {
                                        handleFirestoreError(error, OperationType.UPDATE, `products/${product.id}`);
                                      }
                                    }}
                                    className="w-20 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-center"
                                  />
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                  product.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-500'
                                }`}>
                                  {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setIsModalOpen(true);
                                  }}
                                  className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-20 text-center">
                            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Search className="w-8 h-8 text-stone-300" />
                            </div>
                            <h3 className="text-lg font-black text-stone-900">No products found</h3>
                            <p className="text-stone-500">Try adjusting your search query</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-stone-900">Categories ({filteredCategories.length})</h2>
                <button 
                  onClick={() => {
                    setEditingCategory({});
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-5 h-5" />
                  Add New Category
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map(cat => (
                    <div key={cat.id} className="bg-white p-6 rounded-[2rem] border border-stone-200 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600">
                          <LayoutGrid className="w-6 h-6" />
                        </div>
                        <h3 className="font-black text-stone-900">{cat.name}</h3>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => {
                            setEditingCategory(cat);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-stone-300" />
                    </div>
                    <h3 className="text-lg font-black text-stone-900">No categories found</h3>
                    <p className="text-stone-500">Try adjusting your search query</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[2.5rem] border border-stone-200 shadow-sm overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th className="px-8 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Order ID</th>
                      <th className="px-8 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Customer</th>
                      <th className="px-8 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Item</th>
                      <th className="px-8 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Date</th>
                      <th className="px-8 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Total</th>
                      <th className="px-8 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map(order => {
                        const user = users.find(u => u.uid === order.userId);
                        const pet = pets.find(p => p.id === order.petId);
                        const product = products.find(p => p.id === order.productId);
                        return (
                          <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                            <td className="px-8 py-6 text-sm font-mono text-stone-400">#{order.id.slice(0, 8)}</td>
                            <td className="px-8 py-6">
                              <p className="text-sm font-bold text-stone-900">{user?.displayName || 'Unknown'}</p>
                              <p className="text-xs text-stone-500">{user?.email}</p>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-sm font-bold text-stone-900">{pet?.name || product?.name || 'Unknown'}</p>
                              <p className="text-xs text-stone-500">{pet ? 'Pet' : 'Product'}</p>
                            </td>
                            <td className="px-8 py-6">
                              <select 
                                value={order.status}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none focus:ring-2 focus:ring-stone-200 cursor-pointer ${
                                  order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                                  order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="px-8 py-6 text-sm text-stone-500 font-medium">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-8 py-6 text-sm font-black text-stone-900">${order.totalPrice}</td>
                            <td className="px-8 py-6">
                              <button 
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: 'Delete Order',
                                    message: 'Are you sure you want to delete this order? This action cannot be undone.',
                                    onConfirm: async () => {
                                      try {
                                        await deleteDoc(doc(db, 'orders', order.id));
                                      } catch (error) {
                                        handleFirestoreError(error, OperationType.DELETE, `orders/${order.id}`);
                                      }
                                    },
                                    isDanger: true
                                  });
                                }}
                                className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
                          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-stone-300" />
                          </div>
                          <h3 className="text-lg font-black text-stone-900">No orders found</h3>
                          <p className="text-stone-500">Try adjusting your search query</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[2.5rem] border border-stone-200 shadow-sm overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th className="px-8 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">User</th>
                      <th className="px-8 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Role</th>
                      <th className="px-8 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Joined</th>
                      <th className="px-8 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                        <tr key={user.uid} className="hover:bg-stone-50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
                                <User className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-stone-900">{user.displayName || 'Anonymous'}</p>
                                <p className="text-xs text-stone-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <select 
                                disabled={user.email === 'munaa.tsetsegmaa@gmail.com' || user.uid === currentUser?.uid}
                                value={user.role}
                                onChange={async (e) => {
                                  const newRole = e.target.value as UserRole;
                                  setConfirmModal({
                                    isOpen: true,
                                    title: 'Change User Role',
                                    message: `Are you sure you want to change ${user.displayName || user.email}'s role to ${newRole}?`,
                                    onConfirm: async () => {
                                      try {
                                        await updateDoc(doc(db, 'users', user.uid), { role: newRole });
                                      } catch (error) {
                                        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
                                      }
                                    },
                                    isDanger: newRole === 'admin'
                                  });
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200 cursor-pointer appearance-none transition-all ${
                                  user.role === 'admin' 
                                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                    : 'bg-stone-50 text-stone-700'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                <option value="customer">Customer</option>
                                <option value="admin">Admin</option>
                              </select>
                              {user.email === 'munaa.tsetsegmaa@gmail.com' && (
                                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">System Root</span>
                              )}
                              {user.uid === currentUser?.uid && user.email !== 'munaa.tsetsegmaa@gmail.com' && (
                                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">You</span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm text-stone-500 font-medium">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-8 py-6">
                            <button 
                              disabled={user.email === 'munaa.tsetsegmaa@gmail.com'}
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: 'Delete User',
                                  message: `Are you sure you want to delete user ${user.displayName || user.email}? This action cannot be undone.`,
                                  onConfirm: async () => {
                                    try {
                                      await deleteDoc(doc(db, 'users', user.uid));
                                    } catch (error) {
                                      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}`);
                                    }
                                  },
                                  isDanger: true
                                });
                              }}
                              className="p-2 text-stone-400 hover:text-red-600 transition-colors disabled:opacity-30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-stone-300" />
                          </div>
                          <h3 className="text-lg font-black text-stone-900">No users found</h3>
                          <p className="text-stone-500">Try adjusting your search query</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                setEditingPet(null);
                setEditingProduct(null);
              }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <h3 className="text-2xl font-black text-stone-900">
                  {editingPet ? (editingPet.id ? 'Edit Pet' : 'Add New Pet') : 
                   editingProduct ? (editingProduct.id ? 'Edit Product' : 'Add New Product') :
                   (editingCategory?.id ? 'Edit Category' : 'Add New Category')}
                </h3>
                <button onClick={() => { setIsModalOpen(false); setEditingPet(null); setEditingProduct(null); setEditingCategory(null); }} className="p-2 hover:bg-white rounded-full transition-colors">
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>
              
              <form onSubmit={editingPet ? handleSavePet : editingProduct ? handleSaveProduct : handleSaveCategory} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  {editingPet ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Pet Name</label>
                        <input
                          required
                          value={editingPet.name || ''}
                          onChange={e => setEditingPet({ ...editingPet, name: e.target.value })}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Species</label>
                        <select
                          required
                          value={editingPet.species || ''}
                          onChange={e => setEditingPet({ ...editingPet, species: e.target.value })}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        >
                          <option value="">Select Species</option>
                          <option value="Dog">Dog</option>
                          <option value="Cat">Cat</option>
                          <option value="Bird">Bird</option>
                          <option value="Rabbit">Rabbit</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Breed</label>
                        <input
                          value={editingPet.breed || ''}
                          onChange={e => setEditingPet({ ...editingPet, breed: e.target.value })}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Category</label>
                        <select
                          required
                          value={editingPet.category || ''}
                          onChange={e => setEditingPet({ ...editingPet, category: e.target.value })}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        >
                          <option value="">Select Category</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Age (Years)</label>
                        <input
                          type="number"
                          required
                          value={editingPet.age || ''}
                          onChange={e => setEditingPet({ ...editingPet, age: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Price ($)</label>
                        <input
                          type="number"
                          required
                          value={editingPet.price || ''}
                          onChange={e => setEditingPet({ ...editingPet, price: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                    </>
                  ) : editingProduct ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Product Name</label>
                        <input
                          required
                          value={editingProduct?.name || ''}
                          onChange={e => setEditingProduct({ ...editingProduct!, name: e.target.value })}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Price ($)</label>
                        <input
                          type="number"
                          required
                          value={editingProduct?.price || ''}
                          onChange={e => setEditingProduct({ ...editingProduct!, price: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Category</label>
                        <input
                          required
                          value={editingProduct?.category || ''}
                          onChange={e => setEditingProduct({ ...editingProduct!, category: e.target.value })}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Stock</label>
                        <input
                          type="number"
                          required
                          value={editingProduct?.stock || ''}
                          onChange={e => setEditingProduct({ ...editingProduct!, stock: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isFeatured"
                          checked={editingProduct?.isFeatured || false}
                          onChange={e => setEditingProduct({ ...editingProduct!, isFeatured: e.target.checked })}
                          className="w-5 h-5 accent-emerald-500"
                        />
                        <label htmlFor="isFeatured" className="text-sm font-bold text-stone-700">Featured Product</label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2 col-span-2">
                        <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Category Name</label>
                        <input
                          required
                          value={editingCategory?.name || ''}
                          onChange={e => setEditingCategory({ ...editingCategory!, name: e.target.value })}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Icon Name (Lucide)</label>
                        <input
                          value={editingCategory?.icon || ''}
                          onChange={e => setEditingCategory({ ...editingCategory!, icon: e.target.value })}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                          placeholder="dog, cat, bird, etc."
                        />
                      </div>
                    </>
                  )}
                </div>

                {(editingPet || editingProduct) && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Image URL</label>
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                        <input
                          required
                          value={editingPet ? (editingPet.imageUrl || '') : (editingProduct?.imageUrl || '')}
                          onChange={e => editingPet ? setEditingPet({ ...editingPet, imageUrl: e.target.value }) : setEditingProduct({ ...editingProduct!, imageUrl: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                      {(editingPet?.imageUrl || editingProduct?.imageUrl) && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-stone-200">
                          <img src={editingPet ? editingPet.imageUrl : editingProduct?.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(editingPet || editingProduct) && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Description</label>
                    <textarea
                      rows={4}
                      value={editingPet ? (editingPet.description || '') : (editingProduct?.description || '')}
                      onChange={e => editingPet ? setEditingPet({ ...editingPet, description: e.target.value }) : setEditingProduct({ ...editingProduct!, description: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold resize-none"
                    />
                  </div>
                )}

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingPet(null);
                      setEditingProduct(null);
                      setEditingCategory(null);
                    }}
                    className="flex-1 py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save {editingPet ? 'Pet' : editingProduct ? 'Product' : 'Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDanger={confirmModal.isDanger}
      />
    </div>
  );
}
