import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, LogOut, Home } from 'lucide-react';
import keycloak from '../keycloak';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const userName = keycloak.tokenParsed?.name || keycloak.tokenParsed?.preferred_username || 'Người dùng';

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-wide hover:opacity-90">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span>Quản Lý Quỹ Nhóm</span>
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" /> Trang chủ
          </button>

          <div className="h-5 w-px bg-slate-700" />

          <div className="flex items-center gap-2 text-xs">
            <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-slate-200 hidden sm:inline">{userName}</span>
          </div>

          <button
            onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
            title="Đăng xuất"
            className="p-2 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};