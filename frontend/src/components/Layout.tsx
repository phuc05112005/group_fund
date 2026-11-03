import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, CreditCard, User, LogOut, Wallet, 
  Bell, CheckCircle2, ShieldAlert, X, RefreshCw, Vote, Info, UserCheck, ExternalLink
} from 'lucide-react';
import keycloak from '../keycloak';
import axiosClient from '../api/axiosClient';
import { localStore } from '../api/services';
import type { UserProfile, AppNotification } from '../api/services';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  user: UserProfile | null;
}

const READ_NOTIF_IDS_KEY = 'groupfund_read_notif_ids';

export const Layout: React.FC<LayoutProps> = ({ user }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [selectedNotifDetail, setSelectedNotifDetail] = useState<AppNotification | null>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const getReadNotifIds = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(READ_NOTIF_IDS_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const addReadNotifId = (id: string, maThongBao?: number) => {
    const list = getReadNotifIds();
    if (id && !list.includes(id)) list.push(id);
    if (maThongBao && !list.includes(`tb_${maThongBao}`)) list.push(`tb_${maThongBao}`);
    localStorage.setItem(READ_NOTIF_IDS_KEY, JSON.stringify(list));
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const readIds = getReadNotifIds();
      const localItems = localStore.getNotifications();
      
      let serverItems: AppNotification[] = [];
      try {
        const res = await axiosClient.get('/thong-bao/me');
        if (Array.isArray(res.data)) {
          serverItems = res.data.map((item: any) => {
            const tb = item.thongBao || item;
            const maTB = tb.maThongBao || item.maThongBao || item.id?.maThongBao;
            const ngayTao = tb.ngayTao ? new Date(tb.ngayTao) : new Date();
            const idStr = `srv_${maTB || Math.random()}`;

            const maNhom = tb.maNhom || tb.nhomId || item.maNhom || item.nhomId || tb.nhom?.maNhom;
            const deXuatId = tb.deXuatId || tb.maDeXuat || item.deXuatId || item.maDeXuat;
            const giaoDichId = tb.giaoDichId || tb.maGiaoDich || tb.khoanNopId || tb.khoanChiId || item.giaoDichId || item.khoanNopId || item.khoanChiId;

            let linkVal = tb.linkLienKet || item.linkLienKet;
            if (!linkVal && maNhom) {
              if (deXuatId) linkVal = `/groups/${maNhom}?deXuatId=${deXuatId}`;
              else if (giaoDichId) linkVal = `/groups/${maNhom}?giaoDichId=${giaoDichId}`;
              else linkVal = `/groups/${maNhom}`;
            }

            return {
              id: idStr,
              maThongBao: maTB,
              title: tb.tieuDe || item.tieuDe || 'Thông báo hệ thống',
              message: tb.noiDung || item.noiDung || '',
              time: ngayTao.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + ngayTao.toLocaleDateString('vi-VN'),
              unread: item.daDoc ? false : true,
              type: tb.loaiThongBao || item.loaiThongBao || 'SYSTEM',
              nguoiGui: tb.nguoiTaoName || item.nguoiTaoName || 'Hệ thống Quỹ',
              link: linkVal,
              maNhom,
              deXuatId,
              giaoDichId
            };
          });
        }
      } catch (e) {
        // Fallback local
      }

      const combined = [...localItems, ...serverItems];
      const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

      const syncedNotifs = unique.map(n => {
        const isReadInClient = readIds.includes(n.id) || (n.maThongBao && readIds.includes(`tb_${n.maThongBao}`));
        return isReadInClient ? { ...n, unread: false } : n;
      });

      setNotifications(syncedNotifs);
    } catch (err) {
      console.error('Lỗi khi tải thông báo:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const handleNotifUpdate = () => fetchNotifications();
    window.addEventListener('groupfund_notif_updated', handleNotifUpdate);
    const interval = setInterval(fetchNotifications, 20000);

    return () => {
      window.removeEventListener('groupfund_notif_updated', handleNotifUpdate);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleLogout = () => {
    keycloak.logout({ redirectUri: window.location.origin });
  };

  const handleOpenNotifDetail = async (notif: AppNotification) => {
    addReadNotifId(notif.id, notif.maThongBao);
    localStore.markNotifRead(notif.id);

    setNotifications(prev => prev.map(n => 
      (n.id === notif.id || (n.maThongBao && n.maThongBao === notif.maThongBao)) ? { ...n, unread: false } : n
    ));
    
    if (notif.maThongBao) {
      try {
        await axiosClient.put(`/thong-bao/${notif.maThongBao}/da-doc`);
      } catch (e) {
        console.error('Lỗi đồng bộ đã đọc:', e);
      }
    }

    setSelectedNotifDetail({ ...notif, unread: false });
    setShowNotifications(false);
  };

  const markAllAsRead = async () => {
    notifications.forEach(n => addReadNotifId(n.id, n.maThongBao));
    localStore.markAllNotifsRead();

    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));

    try {
      await axiosClient.put('/thong-bao/da-doc-tat-ca');
    } catch (e) {
      console.error('Lỗi đánh dấu tất cả đã đọc:', e);
    }
  };

  const navItems = [
    { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
    { to: '/transactions', label: 'Giao dịch', icon: CreditCard },
    { to: '/profile', label: 'Cá nhân', icon: User },
  ];

  return (
    <div className="flex h-screen bg-transparent text-slate-100 font-sans overflow-hidden">
      <aside className="w-64 bg-slate-900/60 dark:bg-slate-900/80 border-r border-slate-800/80 backdrop-blur-xl flex flex-col justify-between p-4 z-20 transition-colors duration-300">
        <div>
          <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800/70">
            <div className="relative p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl text-slate-950 shadow-lg shadow-emerald-500/25">
              <Wallet size={24} />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-xl font-semibold leading-none text-aurora-live">GroupFund</h1>
              <p className="text-[10px] text-emerald-400/90 font-semibold tracking-[0.18em] uppercase mt-1">Quỹ nhóm minh bạch</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm ${
                      isActive
                        ? 'text-emerald-300'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 hover:translate-x-1'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-gradient-to-b from-emerald-400 to-teal-400 transition-all duration-300 ${
                          isActive ? 'opacity-100' : 'opacity-0 scale-y-0'
                        }`}
                      />
                      <span
                        className={`absolute inset-0 rounded-xl border transition-colors duration-300 ${
                          isActive ? 'bg-emerald-500/10 border-emerald-500/25' : 'border-transparent'
                        }`}
                      />
                      <Icon size={19} className={`relative transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`} />
                      <span className="relative">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 dark:bg-slate-850/60 border border-slate-800">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                {user?.hoTen ? user.hoTen.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-white truncate">{user?.hoTen || 'Thành viên'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/20 dark:bg-slate-900/40 backdrop-blur-md px-8 flex items-center justify-between z-10 transition-colors duration-300">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="font-medium tracking-wide">Hệ thống hoạt động ổn định</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div className="relative" ref={notifDropdownRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) fetchNotifications();
                }}
                className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce shadow-md">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-drop-in origin-top-right">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">Thông báo mới</h4>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                          {unreadCount} chưa đọc
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={fetchNotifications}
                        title="Tải lại"
                        className="text-slate-400 hover:text-emerald-400 p-1 transition"
                      >
                        <RefreshCw size={14} className={loadingNotifs ? 'animate-spin' : ''} />
                      </button>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-emerald-400 hover:underline font-semibold"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
                    {loadingNotifs && notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs animate-pulse">
                        Đang cập nhật...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        Không có thông báo nào
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleOpenNotifDetail(item)}
                          className={`p-4 transition hover:bg-slate-800/60 flex gap-3 cursor-pointer ${
                            item.unread ? 'bg-slate-850/80 border-l-2 border-emerald-500' : 'opacity-80'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {item.type === 'KHAN_CAP' ? (
                              <ShieldAlert className="text-rose-400" size={18} />
                            ) : item.type === 'DE_XUAT' ? (
                              <Vote className="text-amber-400" size={18} />
                            ) : (
                              <CheckCircle2 className="text-emerald-400" size={18} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-snug ${item.unread ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {item.message}
                            </p>
                            <span className="text-[10px] text-slate-500 mt-1.5 block">
                              {item.time}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>

      {selectedNotifDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-scale-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Info size={18} className="text-emerald-400" />
                Chi tiết thông báo
              </h3>
              <button 
                onClick={() => setSelectedNotifDetail(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Tiêu đề thông báo</span>
                <h4 className="text-sm font-bold text-white mt-0.5">{selectedNotifDetail.title}</h4>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                    <UserCheck size={12} className="text-emerald-400" /> Nguồn phát hành
                  </span>
                  <p className="text-slate-200 font-semibold mt-0.5">{selectedNotifDetail.nguoiGui || 'Hệ thống Quỹ'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Thời gian phát hành</span>
                  <p className="text-amber-400 font-mono mt-0.5">{selectedNotifDetail.time}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Nội dung chi tiết</span>
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-slate-200 leading-relaxed font-medium">
                  {selectedNotifDetail.message}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  const maNhom = selectedNotifDetail.maNhom;
                  const deXuatId = selectedNotifDetail.deXuatId;
                  const giaoDichId = selectedNotifDetail.giaoDichId;
                  
                  let targetLink = selectedNotifDetail.link;
                  if (!targetLink && maNhom) {
                    if (deXuatId) targetLink = `/groups/${maNhom}?deXuatId=${deXuatId}`;
                    else if (giaoDichId) targetLink = `/groups/${maNhom}?giaoDichId=${giaoDichId}`;
                    else targetLink = `/groups/${maNhom}`;
                  }

                  if (targetLink) {
                    navigate(targetLink);
                  } else {
                    alert('Thông báo hệ thống chung.');
                  }
                  setSelectedNotifDetail(null);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md">
                <ExternalLink size={14} /> Xem chi tiết
              </button>

              <button 
                onClick={() => setSelectedNotifDetail(null)} 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};