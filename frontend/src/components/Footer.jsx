import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-white/10 text-white mt-auto relative overflow-hidden">
      {/* Subtle Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-white tracking-wider mb-4 glow-text">SHOPKART</h3>
            <p className="text-gray-400 mb-4 text-sm leading-relaxed">
              Your destination for premium fashion and lifestyle products. Quality meets affordability in the modern era.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 glass rounded-lg flex items-center justify-center hover:bg-red-600 transition hover:scale-105">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 glass rounded-lg flex items-center justify-center hover:bg-red-600 transition hover:scale-105">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 glass rounded-lg flex items-center justify-center hover:bg-red-600 transition hover:scale-105">
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-white">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/products?category=men-tshirts" className="hover:text-red-500 transition">Men's Tees</Link></li>
              <li><Link to="/products?category=women-tshirts" className="hover:text-red-500 transition">Women's Tees</Link></li>
              <li><Link to="/products?category=hoodies" className="hover:text-red-500 transition">Hoodies</Link></li>
              <li><Link to="/products?category=joggers" className="hover:text-red-500 transition">Joggers</Link></li>
              <li><Link to="/products?category=accessories" className="hover:text-red-500 transition">Accessories</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-white">Help</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/orders" className="hover:text-red-500 transition">Track Order</Link></li>
              <li><Link to="/orders" className="hover:text-red-500 transition">Returns & Exchanges</Link></li>
              <li><Link to="/orders" className="hover:text-red-500 transition">Shipping Info</Link></li>
              <li><Link to="/orders" className="hover:text-red-500 transition">FAQs</Link></li>
              <li><Link to="/orders" className="hover:text-red-500 transition">Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-white">Contact</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <span>123 Fashion Street, Mumbai, MH 400001</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-red-500 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-red-500 flex-shrink-0" />
                <span>support@shopkart.in</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">&copy; 2026 ShopKart. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-red-500 transition">Privacy Policy</a>
            <a href="#" className="hover:text-red-500 transition">Terms of Service</a>
            <a href="#" className="hover:text-red-500 transition">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
