import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ArrowDownLeft, ArrowUpRight, Search, PlusCircle, 
  Receipt, X, Filter, Calendar, Folder, RotateCcw, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService, localStore } from '../api/services';
import type { GroupFund } from '../api/services';

interface MergedTransactionItem {
  id: string;
  rawId: number | string;
  type: 'THU' | 'CHI';
  title: string;
  memberName: string;
  memberEmail?: string;
  receiverName?: string;
  groupName: string;
  maNhom?: number | string;
  method: string;
  amount: number;
  status: string;
  date: Date;
  minhChung?: string;
}

// Việt hóa Phương thức thanh toán
const getPaymentMethodText = (method?: string): string => {
  if (!method) return 'Khác';
  const upper = method.toUpperCase();
  switch (upper) {
    case 'VNPAY': return 'VNPay (Tự động)';
    case 'CHUYEN_KHOAN': return 'Chuyển khoản VietQR';
    case 'TIEN_MAT': return 'Tiền mặt';
    default: return method;
  }
};

// Việt hóa Trạng thái giao dịch
const getStatusText = (status?: string, type?: 'THU' | 'CHI'): string => {
  if (!status) return 'Chờ xác nhận';
  const upper = status.toUpperCase();
  switch (upper) {
    case 'DA_XAC_NHAN':
    case 'SUCCESS':
    case 'APPROVED':
      return type === 'CHI' ? 'Đã chi tiền' : 'Đã xác nhận';
    case 'CHO_XAC_NHAN':
    case 'PENDING':
      return 'Chờ xác nhận';
    case 'TU_CHOI':
    case 'THAT_BAI':
    case 'FAILED':
    case 'REJECTED':
    case 'DA_HUY':
      return 'Thất bại / Từ chối';
    default:
      return status;
  }
};

export const TransactionsPage: React.FC = () => {
  const [items, setItems] = useState<MergedTransactionItem[]>([]);
  const [groups, setGroups] = useState<GroupFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<MergedTransactionItem | null>(null);
  
  // Bộ lọc chi tiết
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllTransactionsData = async () => {
      try {
        setLoading(true);

        // 1. Lấy danh sách nhóm của người dùng trước
        const groupsRes = await apiService.getGroups().catch(() => ({ data: [] }));
        const groupList = Array.isArray(groupsRes.data) ? groupsRes.data : [];
        setGroups(groupList);

        // Tra cứu nhanh tên nhóm bằng ID (lưu cả kiểu Number lẫn String)
        const groupMap = new Map<string | number, string>();
        groupList.forEach(g => {
          if (g.maNhom !== undefined && g.maNhom !== null) {
            groupMap.set(g.maNhom, g.tenNhom);
            groupMap.set(String(g.maNhom), g.tenNhom);
            groupMap.set(Number(g.maNhom), g.tenNhom);
          }
        });

        // 2. Truy vấn dữ liệu từ API từng nhóm để ghép nối chính xác tên nhóm 100%
        const groupPromises = groupList.map(async (g) => {
          const [depG, expG] = await Promise.all([
            apiService.getTransactionsByGroup(g.maNhom).catch(() => ({ data: [] })),
            apiService.getExpensesByGroup(g.maNhom).catch(() => ({ data: [] }))
          ]);
          const deps = Array.isArray(depG.data) ? depG.data : [];
          const exps = Array.isArray(expG.data) ? expG.data : [];
          
          return {
            groupDeposits: deps.map(d => ({ ...d, maNhom: g.maNhom, tenNhom: g.tenNhom })),
            groupExpenses: exps.map(e => ({ ...e, maNhom: g.maNhom, tenNhom: g.tenNhom }))
          };
        });

        const [topDepositsRes, topExpensesRes, perGroupResults] = await Promise.all([
          apiService.getTransactions().catch(() => ({ data: [] })),
          apiService.getAllExpenses().catch(() => ({ data: [] })),
          Promise.all(groupPromises)
        ]);

        const serverDeposits = Array.isArray(topDepositsRes.data) ? topDepositsRes.data : [];
        const localDeposits = localStore.getAllDepositsLocal();
        const perGroupDeposits = perGroupResults.flatMap(r => r.groupDeposits);

        const serverExpenses = Array.isArray(topExpensesRes.data) ? topExpensesRes.data : [];
        const localExpenses = localStore.getAllExpensesLocal();
        const perGroupExpenses = perGroupResults.flatMap(r => r.groupExpenses);

        // ĐƯA perGroupDeposits VÀ perGroupExpenses LÊN ĐẦU ĐỂ GIỮ TÊN NHÓM CHUẨN XÁC KHI FILTER UNIQUE
        const allDeposits = [...perGroupDeposits, ...localDeposits, ...serverDeposits];
        const allExpenses = [...perGroupExpenses, ...localExpenses, ...serverExpenses];

        // Hàm trích xuất thông tin tên nhóm chuẩn xác từ DTO backend
        const extractGroupDetails = (raw: any) => {
          if (raw.tenNhom && raw.maNhom) {
            return { maNhom: Number(raw.maNhom), tenNhom: raw.tenNhom };
          }

          const maNhomFound = 
            raw.maNhom || 
            raw.maNhomQuy ||
            raw.nhomId || 
            raw.nhomQuyId || 
            raw.nhomQuy?.maNhom || 
            raw.nhomQuy?.id ||
            raw.nhomQuyResponse?.maNhom ||
            raw.deXuat?.maNhom ||
            raw.deXuat?.nhomQuyId ||
            raw.deXuatResponse?.maNhom ||
            raw.chiTietDeXuat?.deXuat?.maNhom ||
            raw.thanhVienNhom?.nhomQuy?.maNhom;

          let tenNhomFound = 
            raw.tenNhom || 
            raw.tenNhomQuy ||
            raw.nhomName ||
            raw.nhomQuy?.tenNhom || 
            raw.nhomQuyResponse?.tenNhom ||
            raw.deXuat?.nhomQuy?.tenNhom ||
            raw.deXuatResponse?.nhomQuy?.tenNhom ||
            raw.chiTietDeXuat?.deXuat?.nhomQuy?.tenNhom ||
            raw.thanhVienNhom?.nhomQuy?.tenNhom;

          if (!tenNhomFound && maNhomFound !== undefined && maNhomFound !== null) {
            tenNhomFound = groupMap.get(maNhomFound) || groupMap.get(String(maNhomFound)) || groupMap.get(Number(maNhomFound));
          }

          return {
            maNhom: maNhomFound ? Number(maNhomFound) : undefined,
            tenNhom: tenNhomFound || (maNhomFound ? `Nhóm #${maNhomFound}` : 'Chưa gắn nhóm')
          };
        };

        const merged: MergedTransactionItem[] = [
          ...allDeposits.map(d => {
            const raw = d as any;
            const payerObj = raw.nguoiNop || raw.thanhVien;
            
            const resolvedMemberName = payerObj?.hoTen 
              || payerObj?.nguoiDung?.hoTen 
              || raw.nguoiNopName 
              || raw.tenThanhVien 
              || (payerObj?.email ? payerObj.email.split('@')[0] : 'Thành viên');

            const payerEmail = payerObj?.email || payerObj?.nguoiDung?.email || '';
            const groupInfo = extractGroupDetails(raw);

            return {
              id: `dep-${d.maKhoanNop || d.id || Math.random()}`,
              rawId: d.maKhoanNop || d.id || '',
              type: 'THU' as const,
              title: d.noiDung || 'Nộp tiền vào quỹ',
              memberName: resolvedMemberName,
              memberEmail: payerEmail,
              receiverName: d.thuQuyNhanName || 'Ví tạm giữ nhóm',
              groupName: groupInfo.tenNhom,
              maNhom: groupInfo.maNhom,
              method: d.phuongThuc || 'VNPAY',
              amount: d.soTien || 0,
              status: d.trangThai || 'DA_XAC_NHAN',
              date: d.ngayKhaiBao ? new Date(d.ngayKhaiBao) : (d.ngayNop ? new Date(d.ngayNop) : new Date()),
              minhChung: d.minhChung
            };
          }),
          ...allExpenses.map(e => {
            const raw = e as any;
            const thuQuyObj = raw.thuQuyThucHien || raw.nguoiChi;

            const resolvedMemberName = thuQuyObj?.hoTen 
              || thuQuyObj?.nguoiDung?.hoTen 
              || raw.thuQuyThucHienName 
              || raw.tenNguoiChi 
              || (thuQuyObj?.email ? thuQuyObj.email.split('@')[0] : 'Thủ quỹ đại diện');

            const memberEmail = thuQuyObj?.email || thuQuyObj?.nguoiDung?.email || '';

            const recObj = raw.danhSachChiTiet?.[0]?.nguoiNhanChi || raw.nguoiNhanChi;
            const resolvedReceiverName = recObj?.hoTen 
              || recObj?.nguoiDung?.hoTen 
              || raw.nguoiNhanChiName 
              || 'Thành viên thụ hưởng';

            const groupInfo = extractGroupDetails(raw);

            return {
              id: `exp-${e.maKhoanChi || e.maChiTietKhoanChi || e.id || Math.random()}`,
              rawId: e.maKhoanChi || e.id || '',
              type: 'CHI' as const,
              title: e.noiDung || e.noiDungChi || 'Khoản chi quỹ nhóm',
              memberName: resolvedMemberName,
              memberEmail: memberEmail,
              receiverName: resolvedReceiverName,
              groupName: groupInfo.tenNhom,
              maNhom: groupInfo.maNhom,
              method: e.phuongThuc || 'CHUYEN_KHOAN',
              amount: e.soTienTong || e.soTien || 0,
              status: e.trangThai || 'DA_XAC_NHAN',
              date: e.ngayChi ? new Date(e.ngayChi) : (e.ngayTao ? new Date(e.ngayTao) : new Date()),
              minhChung: e.minhChung
            };
          })
        ];

        // Lọc trùng lặp & sắp xếp mới nhất lên đầu
        const uniqueMerged = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        uniqueMerged.sort((a, b) => b.date.getTime() - a.date.getTime());

        setItems(uniqueMerged);
      } catch (err) {
        console.error('Lỗi tải danh sách lịch sử giao dịch:', err);
      } finally { // Lưu ý: Nếu báo lỗi ở từ khóa này, sửa thành 'finally'
        setLoading(false);
      }
    };

    fetchAllTransactionsData();
  }, []);

  // Filter Logic
  const filteredItems = items.filter(t => {
    const matchesSearch = 
      t.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.receiverName && t.receiverName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGroup = filterGroup === 'ALL' || String(t.maNhom) === String(filterGroup);
    const matchesType = filterType === 'ALL' || t.type === filterType;
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;

    let matchesDate = true;
    if (startDateFilter) {
      matchesDate = matchesDate && t.date >= new Date(startDateFilter);
    }
    if (endDateFilter) {
      const eDate = new Date(endDateFilter);
      eDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && t.date <= eDate;
    }

    return matchesSearch && matchesGroup && matchesType && matchesStatus && matchesDate;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterGroup('ALL');
    setFilterType('ALL');
    setFilterStatus('ALL');
    setStartDateFilter('');
    setEndDateFilter('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-3 sm:px-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Lịch sử giao dịch toàn hệ thống</h2>
          <p className="text-slate-400 text-sm mt-0.5">Theo dõi chi tiết nhật ký thu chi, từng nhóm quỹ và thành viên thực hiện.</p>
        </div>

        <button
          onClick={() => navigate('/groups')}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all duration-300 text-xs sm:text-sm shadow-lg shadow-emerald-500/25 shrink-0">
          <PlusCircle size={18} />
          Tạo giao dịch trong nhóm
        </button>
      </div>

      {/* BỘ LỌC CHI TIẾT */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Filter size={15} className="text-emerald-400" /> Bộ lọc giao dịch nâng cao
          </h3>
          {(searchTerm || filterGroup !== 'ALL' || filterType !== 'ALL' || filterStatus !== 'ALL' || startDateFilter || endDateFilter) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition">
              <RotateCcw size={13} /> Đặt lại bộ lọc
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tìm kiếm */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm tên, nội dung..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Lọc Nhóm Quỹ */}
          <div className="min-w-[170px] flex-1 sm:flex-none">
            <select
              value={filterGroup}
              onChange={(e) => { setFilterGroup(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500">
              <option value="ALL">Tất cả Nhóm Quỹ</option>
              {groups.map(g => (
                <option key={g.maNhom} value={g.maNhom}>{g.tenNhom}</option>
              ))}
            </select>
          </div>

          {/* Lọc Thu / Chi */}
          <div className="min-w-[140px] flex-1 sm:flex-none">
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500">
              <option value="ALL">Tất cả Thu/Chi</option>
              <option value="THU">Khoản Thu (+)</option>
              <option value="CHI">Khoản Chi (-)</option>
            </select>
          </div>

          {/* Lọc Trạng thái */}
          <div className="min-w-[150px] flex-1 sm:flex-none">
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500">
              <option value="ALL">Tất cả Trạng thái</option>
              <option value="DA_XAC_NHAN">Đã xác nhận</option>
              <option value="CHO_XAC_NHAN">Chờ xác nhận</option>
              <option value="TU_CHOI">Thất bại / Từ chối</option>
            </select>
          </div>

          {/* Chọn Khoảng Thời Gian */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs shrink-0">
            <Calendar size={14} className="text-emerald-400 shrink-0" />
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => { setStartDateFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-slate-300 focus:outline-none text-xs"
            />
            <span className="text-slate-600">➔</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => { setEndDateFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-slate-300 focus:outline-none text-xs"
            />
          </div>
        </div>
      </div>

      {/* BẢNG BÁO CÁO GIAO DỊCH CHÍNH */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CreditCard size={18} className="text-emerald-400" />
            Bảng Nhật Ký Thu Chi Tổng Hợp ({filteredItems.length} kết quả)
          </h3>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
            Đang tải dữ liệu lịch sử giao dịch...
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            Không tìm thấy giao dịch nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">THÀNH VIÊN THỰC HIỆN</th>
                  <th className="py-3 px-4">NHÓM QUỸ</th>
                  <th className="py-3 px-4">PHƯƠNG THỨC</th>
                  <th className="py-3 px-4">SỐ TIỀN</th>
                  <th className="py-3 px-4 text-right">TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-semibold">
                {paginatedItems.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => setSelectedDetail(item)}
                    className="hover:bg-slate-800/50 transition cursor-pointer group">
                    
                    {/* Thành viên */}
                    <td className="py-4 px-4 text-white font-bold flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl border shrink-0 ${
                        item.type === 'THU' 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {item.type === 'THU' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <div className="group-hover:text-emerald-400 transition text-sm">{item.memberName}</div>
                        <div className="text-[11px] text-slate-400 font-normal line-clamp-1 mt-0.5">{item.title}</div>
                      </div>
                    </td>

                    {/* Tên nhóm thật (Bấm để mở trang nhóm) */}
                    <td className="py-4 px-4">
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.maNhom) {
                            navigate(`/groups/${item.maNhom}`);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 font-medium border border-slate-800 hover:border-emerald-500/40 text-xs transition cursor-pointer"
                        title="Bấm để đến trang nhóm này">
                        <Folder size={13} className="shrink-0" />
                        <span className="truncate max-w-[140px]">{item.groupName}</span>
                      </span>
                    </td>

                    {/* Phương thức */}
                    <td className="py-4 px-4 text-slate-300 font-medium text-xs">
                      {getPaymentMethodText(item.method)}
                    </td>

                    {/* Số tiền */}
                    <td className={`py-4 px-4 font-bold text-sm ${item.type === 'THU' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.type === 'THU' ? '+' : '-'}{item.amount.toLocaleString('vi-VN')} VNĐ
                    </td>

                    {/* Trạng thái */}
                    <td className="py-4 px-4 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === 'DA_XAC_NHAN' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : item.status === 'TU_CHOI' || item.status === 'THAT_BAI'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {getStatusText(item.status, item.type)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Thanh Phân trang */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
            <span>Trang {currentPage} / {totalPages} (Tổng {filteredItems.length} giao dịch)</span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1.5 bg-slate-950 border border-slate-800 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white transition">
                <ChevronLeft size={15} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 bg-slate-950 border border-slate-800 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white transition">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT GIAO DỊCH */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="text-emerald-400" size={20} />
                <h3 className="text-base font-bold text-white">Chi tiết giao dịch minh bạch</h3>
              </div>
              <button onClick={() => setSelectedDetail(null)} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">SỐ TIỀN PHÁT SINH</span>
              <div className={`text-3xl font-black ${selectedDetail.type === 'THU' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selectedDetail.type === 'THU' ? '+' : '-'}{selectedDetail.amount.toLocaleString('vi-VN')} VNĐ
              </div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                selectedDetail.status === 'DA_XAC_NHAN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {getStatusText(selectedDetail.status, selectedDetail.type)}
              </span>
            </div>

            <div className="space-y-3 text-xs divide-y divide-slate-800/60">
              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-400">Thuộc Nhóm Quỹ:</span>
                <span 
                  onClick={() => {
                    if (selectedDetail.maNhom) {
                      navigate(`/groups/${selectedDetail.maNhom}`);
                    }
                  }}
                  className="font-bold text-emerald-400 hover:underline cursor-pointer flex items-center gap-1">
                  <Folder size={13} /> {selectedDetail.groupName} ➔
                </span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Nội Dung Giao Dịch:</span>
                <span className="font-bold text-white text-right max-w-[200px]">{selectedDetail.title}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Thành Viên Thực Hiện:</span>
                <span className="font-bold text-white">{selectedDetail.memberName}</span>
              </div>
              {selectedDetail.memberEmail && (
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">Email Thành Viên:</span>
                  <span className="font-mono text-slate-300">{selectedDetail.memberEmail}</span>
                </div>
              )}
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Đối Tượng Nhận / Thụ Hưởng:</span>
                <span className="font-bold text-amber-400">{selectedDetail.receiverName || 'Ví Quỹ chung'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Phương Thức Thanh Toán:</span>
                <span className="font-semibold text-white">{getPaymentMethodText(selectedDetail.method)}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Thời Gian Ghi Nhận:</span>
                <span className="font-semibold text-slate-200">
                  {selectedDetail.date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {selectedDetail.date.toLocaleDateString('vi-VN')}
                </span>
              </div>
              {selectedDetail.minhChung && (
                <div className="pt-3 space-y-2">
                  <span className="text-slate-400 font-bold block">Hình Ảnh Hóa Đơn / Minh Chứng:</span>
                  <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-40 bg-slate-950 flex items-center justify-center p-2">
                    <img src={selectedDetail.minhChung} alt="Minh chứng" className="max-h-36 object-contain rounded-xl" />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button 
                onClick={() => setSelectedDetail(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};