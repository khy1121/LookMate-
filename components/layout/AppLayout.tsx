
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/app/dashboard', label: '홈', icon: '🏠' },
  { path: '/app/closet', label: '옷장', icon: '👕' },
  { path: '/app/fitting', label: '피팅', icon: '🕴️' },
  { path: '/app/upload', label: '업로드', icon: '➕' },
  { path: '/app/avatar', label: '내 정보', icon: '👤' },
];

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm z-10">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-600 tracking-tight">AI Closet</h1>
        </div>
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
        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-400 text-center">
            v0.1.0 Alpha
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
