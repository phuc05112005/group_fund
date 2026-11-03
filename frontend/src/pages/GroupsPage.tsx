import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, PlusCircle, Search, FolderPlus, Globe, Lock, KeyRound, 
  Vote, Wallet, CheckCircle2, AlertCircle, Info
} from 'lucide-react';
import { apiService } from '../api/services';
import type { GroupFund, Proposal } from '../api/services';

const CURRENCY_OPTIONS = [
  { value: 'VND', label: 'VNĐ - Việt Nam Đồng' },
  { value: 'USD', label: 'USD - Đô la Mỹ' },
  { value: 'EUR', label: 'EUR - Đồng Euro' },
  { value: 'JPY', label: 'JPY - Yên Nhật' },
  { value: 'KRW', label: 'KRW - Won Hàn Quốc' },
];

const PRIVACY_OPTIONS = [
  { value: 'RIENG_TU', label: 'Riêng tư (Vào bằng Mã Nhóm)' },
  { value: 'CONG_KHAI', label: 'Công khai (Tìm thấy công khai)' },
];

interface PendingProposalItem extends Proposal {
  groupName: string;
  maNhom: number;
}

export const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<GroupFund[]>([]);
  const [pendingProposals, setPendingProposals] = useState<PendingProposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  // Notification Modal State (Thay thế alert)
  const [notifyModal, setNotifyModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'danger' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  // Form Fields Tạo Nhóm
  const [tenNhom, setTenNhom] = useState('');
  const [moTa, setMoTa] = useState('');
  const [loaiTienTe, setLoaiTienTe] = useState('VND');
  const [cheDoRiengTu, setCheDoRiengTu] = useState('RIENG_TU');
  const [mucTieuQuy, setMucTieuQuy] = useState<number | ''>('');

  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await apiService.getGroups();
      const groupList = Array.isArray(res.data) ? res.data : [];
      setGroups(groupList);

      const proposalPromises = groupList.map(g =>
        apiService.getProposalsInGroup(g.maNhom)
          .then(pRes => (Array.isArray(pRes.data) ? pRes.data : []).map(p => ({
            ...p,
            groupName: g.tenNhom,
            maNhom: g.maNhom
          })))
          .catch(() => [])
      );

      const allProposalsResults = await Promise.all(proposalPromises);
      const openProposals = allProposalsResults
        .flat()
        .filter(p => p.trangThai === 'CHO_DUYET' || !p.trangThai);

      setPendingProposals(openProposals);
    } catch (err) {
      console.error('Lỗi tải dữ liệu trang chủ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createGroup({
        tenNhom,
        moTa,
        loaiTienTe,
        cheDoRiengTu,
        mucTieuQuy: Number(mucTieuQuy) || 0,
      });
      setShowCreateModal(false);
      setTenNhom('');
      setMoTa('');
      setLoaiTienTe('VND');
      setCheDoRiengTu('RIENG_TU');
      setMucTieuQuy('');
      fetchDashboardData();
      setNotifyModal({
        isOpen: true,
        title: 'Tạo nhóm thành công',
        message: 'Nhóm quỹ mới của bạn đã được khởi tạo thành công!',
        type: 'success',
      });
    } catch (err: any) {
      setNotifyModal({
        isOpen: true,
        title: 'Tạo nhóm thất bại',
        message: err?.response?.data?.message || 'Tạo nhóm thất bại!',
        type: 'danger',
      });
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      const res = await apiService.joinGroupByCode(joinCode.trim());
      setShowJoinModal(false);
      setJoinCode('');
      fetchDashboardData();

      const resData = res.data as any;

      // Kiểm tra toàn bộ điều kiện nhóm riêng tư / cần chờ duyệt
      const isPending = 
        resData?.cheDoRiengTu === 'RIENG_TU' ||
        resData?.trangThaiYeuCau === 'CHO_DUYET' ||
        resData?.trangThai === 'CHO_DUYET' ||
        resData?.trangThaiThanhVien === 'CHO_DUYET' ||
        (typeof resData === 'string' && (resData.includes('chờ') || resData.includes('duyệt') || resData.includes('riêng tư'))) ||
        (resData?.message && (resData.message.includes('chờ') || resData.message.includes('duyệt') || resData.message.includes('riêng tư')));

      const displayMessage = 
        typeof resData === 'string' ? resData : 
        (resData?.message || (isPending 
          ? 'Đã gửi yêu cầu gia nhập! Vui lòng chờ Quản trị viên nhóm phê duyệt.' 
          : 'Tham gia nhóm thành công!'));

      setNotifyModal({
        isOpen: true,
        title: isPending ? 'Yêu cầu đang chờ duyệt' : 'Tham gia nhóm thành công',
        message: displayMessage,
        type: isPending ? 'info' : 'success',
      });

      if (!isPending && resData?.maNhom) {
        navigate(`/groups/${resData.maNhom}`);
      }
    } catch (err: any) {
      setNotifyModal({
        isOpen: true,
        title: 'Không thể tham gia nhóm',
        message: err?.response?.data?.message || 'Mã nhóm không hợp lệ hoặc bạn đã ở trong nhóm!',
        type: 'danger',
      });
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.tenNhom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCombinedBalance = groups.reduce((sum, g) => sum + (g.soDuQuy || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER TRANG CHỦ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Tổng Quan Quỹ Nhóm</h2>
          <p className="text-slate-400 text-sm mt-0.5">Theo dõi các nhóm quỹ bạn đã tham gia và các đề xuất cần biểu quyết.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-amber-400/40 font-semibold px-4 py-2.5 rounded-xl transition-all duration-300 text-xs sm:text-sm">
            <KeyRound size={18} className="text-amber-400" />
            Nhập mã nhóm
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all duration-300 text-xs sm:text-sm shadow-lg shadow-emerald-500/25">
            <PlusCircle size={18} />
            Tạo nhóm mới
          </button>
        </div>
      </div>

      {/* THỐNG KÊ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 hover:border-purple-500/35 rounded-3xl p-5 flex items-center justify-between shadow-xl transition-all">
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Số nhóm đã tham gia</span>
            <div className="text-2xl font-black text-white">{groups.length} <span className="text-xs font-normal text-slate-400">nhóm</span></div>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/35 rounded-3xl p-5 flex items-center justify-between shadow-xl transition-all">
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Đề xuất đang mở</span>
            <div className="text-2xl font-black text-amber-400">{pendingProposals.length} <span className="text-xs font-normal text-slate-400">bản</span></div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <Vote size={22} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/35 rounded-3xl p-5 flex items-center justify-between shadow-xl transition-all">
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Tổng số dư quỹ tích lũy</span>
            <div className="text-xl font-black text-emerald-400">{totalCombinedBalance.toLocaleString('vi-VN')} VND</div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <Wallet size={22} />
          </div>
        </div>
      </div>

      {/* DANH SÁCH CÁC NHÓM QUỸ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white">Danh Sách Nhóm Quỹ Của Bạn</h3>

          <div className="relative max-w-xs w-full">
            <Search size={16} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Nhập tên nhóm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
            Đang tải danh sách nhóm quỹ...
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="py-16 px-4 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/40">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
              <FolderPlus size={28} />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Không Tìm Thấy Nhóm Quỹ</h4>
            <p className="text-slate-400 text-xs max-w-sm mx-auto mb-4">
              Chưa có nhóm nào phù hợp hoặc bạn chưa tham gia nhóm quỹ nào.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGroups.map((group) => (
              <div
                key={group.maNhom}
                onClick={() => navigate(`/groups/${group.maNhom}`)}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition-all duration-300 space-y-4 shadow-xl cursor-pointer group">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl group-hover:scale-105 transition-transform">
                    <Users size={20} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">
                      {group.loaiTienTe || 'VND'}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-display font-semibold text-white text-lg group-hover:text-emerald-300 transition-colors">
                    {group.tenNhom}
                  </h4>
                  <p className="text-slate-400 text-xs mt-1 line-clamp-2">
                    {group.moTa || 'Chưa có mô tả nhóm'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Số Dư Quỹ</span>
                    <p className="text-base font-black text-emerald-400">
                      {(group.soDuQuy || 0).toLocaleString('vi-VN')} {group.loaiTienTe || 'VND'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/groups/${group.maNhom}`);
                    }}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl transition font-bold">
                    Vào Nhóm
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL TẠO NHÓM MỚI */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-white">Tạo Nhóm Quỹ Mới</h3>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Tên Nhóm Quỹ (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên nhóm..."
                  value={tenNhom}
                  onChange={(e) => setTenNhom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs font-bold text-slate-400 mb-1.5">
                    <Globe size={14} className="text-emerald-400" />
                    Loại Tiền Tệ
                  </label>
                  <select
                    value={loaiTienTe}
                    onChange={(e) => setLoaiTienTe(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500">
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-1 text-xs font-bold text-slate-400 mb-1.5">
                    <Lock size={14} className="text-amber-400" />
                    Quyền Riêng Tư
                  </label>
                  <select
                    value={cheDoRiengTu}
                    onChange={(e) => setCheDoRiengTu(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500">
                    {PRIVACY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Mục Tiêu Quỹ (Nếu có)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Nhập mục tiêu số tiền..."
                  value={mucTieuQuy}
                  onChange={(e) => setMucTieuQuy(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Mô Tả Nhóm</label>
                <textarea
                  rows={2}
                  placeholder="Nhập mô tả..."
                  value={moTa}
                  onChange={(e) => setMoTa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700">
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 shadow-lg shadow-emerald-500/20">
                  Xác Nhận Tạo Nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NHẬP MÃ NHÓM */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <KeyRound size={20} className="text-amber-400" />
              Tham Gia Nhóm Qua Mã
            </h3>

            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Mã Mời Nhóm</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập mã nhóm..."
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm font-mono tracking-wider focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700">
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20">
                  Tham Gia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÔNG BÁO TÙY CHỈNH THAY THẾ ALERT MẶC ĐỊNH */}
      {notifyModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 shrink-0">
                {notifyModal.type === 'success' && <CheckCircle2 className="text-emerald-400" size={24} />}
                {notifyModal.type === 'info' && <Info className="text-blue-400" size={24} />}
                {notifyModal.type === 'danger' && <AlertCircle className="text-rose-400" size={24} />}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">{notifyModal.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{notifyModal.message}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setNotifyModal({ ...notifyModal, isOpen: false })}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-md">
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};