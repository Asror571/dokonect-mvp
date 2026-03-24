import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useCartStore } from '../../store/cart.store';
import { ShoppingCart, LogOut, LayoutGrid, PackageOpen, Zap } from 'lucide-react';

const navLinks = [
  { to: '/catalog', icon: LayoutGrid,  label: 'Katalog' },
  { to: '/orders',  icon: PackageOpen, label: 'Buyurtmalar' },
];

const StoreNavbar = () => {
  const { user, logout } = useAuthStore();
  const { items } = useCartStore();
  const navigate = useNavigate();

  const cartCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const initials = user?.name?.slice(0, 2).toUpperCase() || 'S';

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-violet-500/30">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-base tracking-tight">
              Doko<span className="text-violet-600">nect</span>
            </span>
          </NavLink>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`
                }
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `relative p-2 rounded-lg transition-all ${
                  isActive ? 'bg-violet-50 text-violet-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`
              }
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-violet-600 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </NavLink>

            {/* Profile */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all"
            >
              <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                {user?.name}
              </span>
            </button>

            {/* Logout */}
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Chiqish"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StoreNavbar;
