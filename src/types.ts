export type PetStatus = 'available' | 'pending' | 'adopted';
export type OrderStatus = 'pending' | 'completed' | 'cancelled';
export type UserRole = 'admin' | 'customer';

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  price: number;
  description: string;
  imageUrl: string;
  status: PetStatus;
  category: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category: string;
  isFeatured: boolean;
  stock: number;
}

export interface Order {
  id: string;
  userId: string;
  petId?: string;
  productId?: string;
  status: OrderStatus;
  totalPrice: number;
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'pet' | 'product';
  addedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
