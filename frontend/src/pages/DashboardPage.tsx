import React, { useEffect, useState } from 'react';
import { 
  Users, PlusCircle, Search, FolderPlus, KeyRound, 
  Vote, ArrowRight, Check, Copy, ChevronLeft, ChevronRight, Target, Globe, Lock,
  Sparkles, X, Clock, Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../api/services';
import type { GroupFund, UserProfile, Proposal } from '../api/services';

const CURRENCY_OPTIONS = [
  { value: 'VND', label: 'VNĐ - Việt Nam Đồng' },
  { value: 'USD', label: 'USD - Đô la Mỹ' },
  { value: 'EUR', label: 'EUR - Đồng Euro' },
];

interface PendingProposalItem extends Proposal {
  groupName: string;
  maNhom: number;
}

interface DashboardProps {
  user: UserProfile | null;
}

export const DashboardPage: React.FC<DashboardProps> = ({ user }) => {
  const [groups, setGroups] = useState<GroupFund[]>([]);
  const [pendingProposals, setPendingProposals] = useState<PendingProposalItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tìm kiếm, Bộ lọc & Phân trang
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showProposalsModal, setShowProposalsModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form Fields Tạo Nhóm
  const [joinCode, setJoinCode] = useState('');
  const [tenNhom, setTenNhom] = useState('');
  const [moTa, setMoTa] = useState('');
  const [loaiTienTe, setLoaiTienTe] = useState('VND');
  const [cheDoRiengTu, setCheDoRiengTu] = useState<'RIENG_TU' | 'CONG_KHAI'>('RIENG_TU');
  const [mucTieuQuy, setMucTieuQuy] = useState<string>('');

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
      const activeProps = allProposalsResults
        .flat()
        .filter(p => p.trangThai === 'CHO_DUYET' || p.trangThai === 'DA_THONG_QUA');

      setPendingProposals(activeProps);
    } catch (err) {
      console.error('Lỗi tải dữ liệu tổng quan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createGroup({
        tenNhom,
        moTa,
        loaiTienTe,
        cheDoRiengTu,
        mucTieuQuy: parseFloat(mucTieuQuy) || 0,
      });
      setShowCreateModal(false);
      setTenNhom('');
      setMoTa('');
      setMucTieuQuy('');
      setCheDoRiengTu('RIENG_TU');
      fetchDashboardData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Tạo nhóm thất bại!');
    }
  };

  // XỬ LÝ NHẬP MÃ THAM GIA (CÓ PHÂN BIỆT RIÊNG TƯ / CÔNG KHAI)
  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      const res = await apiService.joinGroupByCode(joinCode.trim().toUpperCase());
      setShowJoinModal(false);
      setJoinCode('');
      
      const data = res.data as any;

      // Kiểm tra tất cả các dấu hiệu nhóm riêng tư / chờ duyệt
      const isPending = 
        data?.cheDoRiengTu === 'RIENG_TU' || 
        data?.trangThaiYeuCau === 'CHO_DUYET' ||
        data?.trangThai === 'CHO_DUYET' ||
        data?.trangThaiThanhVien === 'CHO_DUYET' ||
        (typeof data === 'string' && (data.includes('chờ') || data.includes('duyệt'))) ||
        (data?.message && (data.message.includes('chờ') || data.message.includes('duyệt')));

      if (isPending) {
        alert('Đã gửi yêu cầu gia nhập! Vì đây là nhóm Riêng tư, vui lòng chờ Quản trị viên phê duyệt.');
      } else {
        alert('Tham gia nhóm thành công!');
        if (data?.maNhom) {
          navigate(`/groups/${data.maNhom}`);
        }
      }
      fetchDashboardData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Mã nhóm không tồn tại hoặc bạn đã ở trong nhóm!');
    }
  };

  const filteredGroups = groups.filter(g => {
    const matchesSearch = g.tenNhom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (g.moTa && g.moTa.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCurrency = filterCurrency === 'ALL' || g.loaiTienTe === filterCurrency;
    const matchesStatus = filterStatus === 'ALL' || g.trangThai === filterStatus;
    return matchesSearch && matchesCurrency && matchesStatus;
  });

  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage) || 1;
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // TÍNH TỔNG NGÂN SÁCH CÁC QUỸ BẠN ĐANG THAM GIA (THAY CHO THỐNG KÊ 0 VND CŨ)
  const totalManagedBalance = groups.reduce((sum, g) => sum + (g.soDuQuy || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 p-6 shadow-glow backdrop-blur-md animate-fade-up">
        <div className="pointer-events-none absolute inset-0 aurora" />
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl animate-float" />
        <div className="absolute -left-10 -bottom-24 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl animate-float [animation-delay:2s]" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[11px] font-semibold mb-3">
              <Sparkles size={13} /> Sổ quỹ minh bạch & rõ ràng
            </div>
            <h2 className="text-2xl font-semibold text-white tracking-tight">
              Xin chào, <span className="text-aurora-live">{user?.hoTen || 'Thành viên'}</span>
            </h2>
            <p className="text-slate-400 text-xs mt-1.5 max-w-xl leading-relaxed">
              Theo dõi biến động quỹ nhóm, tham gia biểu quyết thu chi và nắm rõ từng đồng ra vào — tức thì, minh bạch.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 bg-slate-950/70 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-amber-400/40 font-semibold px-4 py-2.5 rounded-2xl transition-all duration-300 text-xs shadow-sm active:scale-[0.97]">
              <KeyRound size={16} className="text-amber-400" />
              Nhập mã nhóm
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-2xl transition-all duration-300 text-xs shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 active:scale-[0.97]">
              <PlusCircle size={16} />
              Tạo nhóm mới
            </button>
          </div>
        </div>
      </div>

      {/* METRICS GRID - 3 THỐNG KÊ ĐÃ ĐƯỢC NÂNG CẤP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* STAT 1: SỐ NHÓM ĐÃ THAM GIA */}
        <div 
          onClick={() => {
            document.getElementById('group-list-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/35 rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 cursor-pointer group shadow-lg hover:shadow-glow animate-fade-up [animation-delay:80ms]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider group-hover:text-purple-300 transition">
              Nhóm đang tham gia
            </span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {groups.length} <span className="text-xs font-normal text-slate-400">nhóm</span>
          </div>
          <p className="text-[11px] text-purple-400/90 mt-2.5 font-medium flex items-center gap-1">
            Xem tất cả nhóm phía dưới <ArrowRight size={13} />
          </p>
        </div>

        {/* STAT 2: ĐỀ XUẤT CHỜ BIỂU QUYẾT */}
        <div 
          onClick={() => setShowProposalsModal(true)}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/35 rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 cursor-pointer group shadow-lg hover:shadow-glow animate-fade-up [animation-delay:160ms]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider group-hover:text-amber-300 transition">
              Đề xuất chờ duyệt
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Vote size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">
            {pendingProposals.length} <span className="text-xs font-normal text-slate-400">bản</span>
          </div>
          <p className="text-[11px] text-amber-400/90 mt-2.5 font-medium flex items-center gap-1">
            Xem danh sách bản biểu quyết <ArrowRight size={13} />
          </p>
        </div>

        {/* STAT 3 THAY THẾ MỚI: TỔNG NGÂN SÁCH CÁC QUỸ */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg hover:shadow-glow transition-all duration-300 hover:-translate-y-1 animate-fade-up [animation-delay:240ms]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Tổng ngân sách các quỹ
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Wallet size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {totalManagedBalance.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">VND</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5">
            Tổng số dư thực tế từ {groups.length} nhóm bạn đang quản lý
          </p>
        </div>
      </div>

      {/* CÁC ĐỀ XUẤT CẦN XỬ LÝ (NẾU CÓ) */}
      {pendingProposals.length > 0 && (
        <div className="bg-slate-900/80 border border-amber-500/20 rounded-3xl p-5 space-y-3 shadow-xl animate-fade-up [animation-delay:120ms]">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Clock size={15} /> Đề xuất cần chú ý ({pendingProposals.length})
            </h3>
            <span className="text-[11px] text-slate-400">Bấm để xem chi tiết trong nhóm</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingProposals.slice(0, 4).map((prop) => (
              <div
                key={prop.maDeXuat}
                onClick={() => navigate(`/groups/${prop.maNhom}`)}
                className="p-3.5 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-2xl cursor-pointer transition flex items-center justify-between group">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-amber-400 font-semibold border border-slate-800">
                      {prop.groupName}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      prop.loaiDeXuat === 'THU' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {prop.loaiDeXuat}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition line-clamp-1">{prop.tieuDe || prop.tenDeXuat}</h4>
                  <p className="text-xs text-emerald-400 font-semibold">{(prop.soTienTong || prop.soTienDeXuat)?.toLocaleString()} VND</p>
                </div>

                <ArrowRight size={16} className="text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DANH SÁCH NHÓM QUỸ */}
      <div id="group-list-section" className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-4 animate-fade-up [animation-delay:180ms]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Danh sách nhóm quỹ</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Quản lý và truy cập nhanh các nhóm quỹ bạn tham gia</p>
          </div>

          {/* TOOLBAR TÌM KIẾM & BỘ LỌC */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm tên nhóm..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <select
              value={filterCurrency}
              onChange={(e) => { setFilterCurrency(e.target.value); setCurrentPage(1); }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none">
              <option value="ALL">Tất cả tiền tệ</option>
              <option value="VND">VND</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none">
              <option value="ALL">Tất cả trạng thái</option>
              <option value="HOAT_DONG">Đang hoạt động</option>
              <option value="CLOSED">Đã đóng</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
            Đang tải danh sách nhóm...
          </div>
        ) : paginatedGroups.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
            <FolderPlus size={28} className="text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-white">Không tìm thấy nhóm quỹ phù hợp</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedGroups.map((group, gi) => {
              const progressPct = group.mucTieuQuy > 0 
                ? Math.min(100, Math.round(((group.soDuQuy || 0) / group.mucTieuQuy) * 100))
                : null;

              return (
                <div
                  key={group.maNhom}
                  onClick={() => navigate(`/groups/${group.maNhom}`)}
                  style={{ animationDelay: `${gi * 70}ms` }}
                  className="p-4 rounded-3xl bg-slate-950/50 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 space-y-3 shadow-lg hover:shadow-glow cursor-pointer group flex flex-col justify-between animate-fade-up">
                  <div>
                    <div className="flex justify-between items-start mb-2.5">
                      <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                        <Wallet size={16} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] font-semibold border border-slate-800">
                          {group.loaiTienTe || 'VND'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          group.cheDoRiengTu === 'RIENG_TU' 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {group.cheDoRiengTu === 'RIENG_TU' ? 'Riêng tư' : 'Công khai'}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-display font-semibold text-white text-base group-hover:text-emerald-300 transition-colors">
                      {group.tenNhom}
                    </h4>
                    <p className="text-slate-400 text-xs mt-1 line-clamp-2">
                      {group.moTa || 'Chưa có mô tả nhóm'}
                    </p>

                    {group.maMoi && (
                      <div className="mt-2.5 flex items-center justify-between bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                        <span className="text-[11px] font-mono text-slate-400">
                          Mã: <strong className="text-amber-400">{group.maMoi}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(group.maMoi!, e)}
                          title="Sao chép mã nhóm"
                          className="p-0.5 text-slate-400 hover:text-emerald-400 transition">
                          {copiedCode === group.maMoi ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                    )}

                    {progressPct !== null && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Target size={11} className="text-emerald-400" /> Mục tiêu: {(group.mucTieuQuy || 0).toLocaleString()} {group.loaiTienTe}
                          </span>
                          <span className="text-emerald-400 font-bold">{progressPct}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/60">
                          <div className="bar-shimmer bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-800/80 flex justify-between items-center mt-2">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Số dư quỹ</span>
                      <p className="text-sm font-bold text-emerald-400">
                        {(group.soDuQuy || 0).toLocaleString('vi-VN')} {group.loaiTienTe || 'VND'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate(`/groups/${group.maNhom}`); }}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl transition font-semibold">
                      Vào nhóm
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            <span>Trang {currentPage} / {totalPages} (Tổng {filteredGroups.length} nhóm)</span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1 bg-slate-950 border border-slate-800 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white">
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1 bg-slate-950 border border-slate-800 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL TẠO NHÓM MỚI */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Tạo nhóm quỹ mới</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tên nhóm (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Quỹ Lớp 12A, Quỹ Du lịch..."
                  value={tenNhom}
                  onChange={(e) => setTenNhom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Loại tiền tệ</label>
                  <select
                    value={loaiTienTe}
                    onChange={(e) => setLoaiTienTe(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mục tiêu quỹ</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="VD: 10000000"
                    value={mucTieuQuy}
                    onChange={(e) => setMucTieuQuy(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Quyền riêng tư</label>
                <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800/80 rounded-xl">
                  <div className="flex items-center gap-2">
                    {cheDoRiengTu === 'RIENG_TU' ? <Lock size={15} className="text-amber-400" /> : <Globe size={15} className="text-emerald-400" />}
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        {cheDoRiengTu === 'RIENG_TU' ? 'Riêng tư' : 'Công khai'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {cheDoRiengTu === 'RIENG_TU' ? 'Cần Trưởng nhóm duyệt khi nhập mã' : 'Vào nhóm trực tiếp'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheDoRiengTu(prev => prev === 'RIENG_TU' ? 'CONG_KHAI' : 'RIENG_TU')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      cheDoRiengTu === 'RIENG_TU' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  >
                    <div className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      cheDoRiengTu === 'RIENG_TU' ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Mô tả nhóm</label>
                <textarea
                  rows={2}
                  placeholder="Mục đích thu chi..."
                  value={moTa}
                  onChange={(e) => setMoTa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl shadow-md">Tạo nhóm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NHẬP MÃ MỜI */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <KeyRound size={16} className="text-amber-400" /> Tham gia nhóm qua mã
              </h3>
              <button onClick={() => setShowJoinModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleJoinByCode} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Mã mời nhóm (VD: GF-8A2C9B)</label>
                <input
                  type="text"
                  required
                  placeholder="GF-XXXXXX"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase tracking-wider focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowJoinModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-md">Tham gia ngay</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM DANH SÁCH ĐỀ XUẤT ĐANG MỞ */}
      {showProposalsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-lg shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Vote size={16} className="text-amber-400" /> Đề xuất đang biểu quyết
              </h3>
              <button onClick={() => setShowProposalsModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {pendingProposals.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Hiện không có đề xuất nào cần biểu quyết.</p>
            ) : (
              <div className="space-y-2">
                {pendingProposals.map((prop) => (
                  <div
                    key={prop.maDeXuat}
                    onClick={() => { setShowProposalsModal(false); navigate(`/groups/${prop.maNhom}`); }}
                    className="p-3 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl cursor-pointer transition flex items-center justify-between">
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-amber-400 font-semibold border border-slate-800">
                        {prop.groupName}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-1">{prop.tieuDe || prop.tenDeXuat}</h4>
                      <p className="text-xs text-emerald-400 font-semibold mt-0.5">{(prop.soTienTong || prop.soTienDeXuat)?.toLocaleString()} VND</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};