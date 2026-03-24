import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, PackageSearch, PackagePlus, LayoutList, ClipboardList, UserCircle, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

const menuItems = [
  { to: '/distributor/products',     icon: LayoutList,    label: 'Mahsulotlar' },
  { to: '/distributor/products/add', icon: PackagePlus,   label: 'Yangi mahsulot' },
  { to: '/distributor/orders',       icon: ClipboardList, label: 'Buyurtmalar' },
  { to: '/profile',                  icon: UserCircle,    label: 'Profil' },
];

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name?.slice(0, 2).toUpperCase() || 'D';

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-full fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-600/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Doko<span className="text-violet-400">nect</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Menyu</p>
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/distributor/products'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Distribyutor</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Chiqish
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
