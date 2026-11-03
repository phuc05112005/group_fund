import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import keycloak from './keycloak';
import { apiService } from './api/services';
import type { UserProfile } from './api/services';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { GroupsPage } from './pages/GroupsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { GroupDetailPage } from './pages/GroupDetailPage';
import { PaymentResultPage } from './pages/PaymentResultPage'; // 1. Thêm Import trang kết quả VNPay

export const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Hàm tải hoặc đồng bộ Profile (Ưu tiên lấy từ CSDL trước)
  const fetchProfile = useCallback(async () => {
    try {
      // 1. Thử lấy thông tin từ CSDL Backend
      const res = await apiService.getProfile();
      setUserProfile(res.data);
    } catch (error) {
      console.warn('Chưa có dữ liệu người dùng trong CSDL, đang tiến hành đồng bộ...');
      
      // 2. Nếu CSDL chưa có (User mới), tự động Sync thông tin từ Keycloak Token sang CSDL
      if (keycloak.tokenParsed) {
        const firstName = keycloak.tokenParsed.given_name || '';
        const lastName = keycloak.tokenParsed.family_name || '';
        const fullName = (lastName + ' ' + firstName).trim() 
          || keycloak.tokenParsed.name 
          || keycloak.tokenParsed.preferred_username 
          || 'Thành viên mới';

        try {
          const syncRes = await apiService.syncUser({
            hoTen: fullName,
            email: keycloak.tokenParsed.email || '',
            soDienThoai: '',
          });
          setUserProfile(syncRes.data);
        } catch (syncErr) {
          console.error('Không thể đồng bộ người dùng:', syncErr);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Tự động chạy khi trạng thái đăng nhập thay đổi
  useEffect(() => {
    if (keycloak.authenticated) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [keycloak.authenticated, fetchProfile]);

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 text-slate-100 flex items-center justify-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 aurora" />
        <div className="relative text-center space-y-4 animate-fade-up">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-gradient-to-tr from-emerald-500/20 to-amber-400/20 shadow-glow animate-float">
            <div className="h-6 w-6 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-aurora-live">GroupFund</h1>
            <p className="text-slate-400 text-xs font-medium mt-1.5 tracking-wide">Quỹ nhóm minh bạch — đang chuẩn bị sổ sách…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout user={userProfile} />}>
          <Route index element={<DashboardPage user={userProfile} />} />
          <Route path="profile" element={<ProfilePage user={userProfile} onRefresh={fetchProfile} />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="groups/:maNhom" element={<GroupDetailPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="payment-result" element={<PaymentResultPage />} /> {/* 2. Khai báo Route nhận phản hồi VNPay */}
          
          <Route path="internal/admin" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;