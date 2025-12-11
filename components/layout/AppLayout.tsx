
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { logout as authLogout } from '../../services/authService';
import { getCurrentBrand } from '../../config/branding';

const NAV_ITEMS = [
  { path: '/app/dashboard', label: '홈', icon: '🏠' },
  { path: '/app/closet', label: '옷장', icon: '👕' },
  { path: '/app/fitting', label: '피팅', icon: '🕴️' },
  { path: '/app/explore', label: 'Explore', icon: '🌐' },
  { path: '/app/discover', label: 'Discover', icon: '📷' },
  { path: '/app/upload', label: '업로드', icon: '➕' },
  { path: '/app/avatar', label: '내 정보', icon: '👤' },
];

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useStore((state) => state.currentUser);
  const setCurrentUser = useStore((state) => state.setCurrentUser);

  const { logoSrc, tagline } = getCurrentBrand();

  const handleLogout = async () => {
    if (!confirm('로그아웃하시겠습니까?')) return;
    
    try {
      await authLogout();
      setCurrentUser(null);
      navigate('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm z-10">
        <div className="p-6 flex items-center gap-3">
          <img src={logoSrc} alt="LookMate 로고" className="h-10" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-indigo-600">LookMate</h1>
            <p className="text-[10px] text-gray-400 leading-tight">{tagline}</p>
          </div>
        </div>
        {currentUser && (
          <div className="px-6 pb-4">
            <p className="text-xs text-gray-500 truncate">
              {currentUser.displayName}
            </p>
          </div>
        )}
        <nav className="flex-1 px-4 space-y-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <span className="mr-3 text-xl">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        
        {/* Logout Button */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>🚪</span>
            로그아웃
          </button>
          <div className="text-xs text-gray-400 text-center mt-2">
            v0.2.0 Alpha
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative pb-20 md:pb-0 scroll-smooth">
        <div className="max-w-6xl mx-auto p-4 md:p-8 min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around py-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-1 text-[10px] ${
                isActive ? 'text-indigo-600 font-bold' : 'text-gray-400'
              }`
            }
          >
            <span className="text-xl mb-1">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
