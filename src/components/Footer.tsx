import { Link } from 'react-router-dom';
import { PawPrint, Instagram, Twitter, Facebook, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-emerald-500 rounded-xl group-hover:bg-emerald-400 transition-colors">
                <PawPrint className="w-6 h-6 text-stone-900" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">Pawfect</span>
            </Link>
            <p className="text-sm leading-relaxed font-medium">
              We believe every pet deserves a loving home and the best care possible. 
              Our mission is to connect happy pets with happy families.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-stone-800 rounded-lg hover:bg-emerald-500 hover:text-stone-900 transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-stone-800 rounded-lg hover:bg-emerald-500 hover:text-stone-900 transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-stone-800 rounded-lg hover:bg-emerald-500 hover:text-stone-900 transition-all">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link to="/" className="hover:text-emerald-400 transition-colors">Find a Pet</Link></li>
              <li><Link to="/products" className="hover:text-emerald-400 transition-colors">Pet Supplies</Link></li>
              <li><Link to="/admin" className="hover:text-emerald-400 transition-colors">Admin Dashboard</Link></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Pet Categories</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link to="/" className="hover:text-emerald-400 transition-colors">Dogs</Link></li>
              <li><Link to="/" className="hover:text-emerald-400 transition-colors">Cats</Link></li>
              <li><Link to="/" className="hover:text-emerald-400 transition-colors">Birds</Link></li>
              <li><Link to="/" className="hover:text-emerald-400 transition-colors">Small Animals</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Get in Touch</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-emerald-500" />
                123 Pet Lane, Animal City, AC 12345
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-500" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-emerald-500" />
                hello@pawfect.com
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-bold uppercase tracking-widest">
            © 2026 Pawfect Pet Store. All rights reserved.
          </p>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
