import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, FileText, Check, Copy, Users, Shield, 
  CreditCard, Image as ImageIcon, Search, Filter, ThumbsUp, ThumbsDown, 
  CheckCircle, XCircle, UserCheck, Trash2, LogOut, Power, Settings, Vote, X
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

interface NhomQuy {
  maNhom: number;
  tenNhom: string;
  moTa: string;
  maThamGia: string;
  trangThai: string;
  mucTieuQuy: number | null;
  soDuHienTai: number;
  loaiTienTe: string;
  cheDoRiengTu: string;
  batPheDuyet?: boolean;
  batBieuQuyet?: boolean;
  thoiHanBieuQuyetGio?: number;
}

interface ThanhVien {
  maThanhVienNhom: number;
  maNguoiDung: number;
  tenNguoiDung: string;
  hoTen: string;
  tenVaiTro: string;
  danhSachVaiTro?: string[];
}

interface DotThu {
  maNghiaVu?: number;
  maDotThu?: number;
  tenNghiaVu?: string;
  tenDotThu?: string;
  soTienMacDinh?: number;
  soTienBatBuoc?: number;
}

interface KhoanNop {
  maKhoanNop: number;
  tenNguoiKhaiBao: string;
  tenThuQuyNhan: string;
  soTien: number;
  phuongThuc: string;
  duongDanMinhChung?: string;
  ghiChu?: string;
  trangThai: string;
  ngayKhaiBao: string;
}

interface DeXuatChi {
  maDeXuat: number;
  tenNguoiTao: string;
  tieuDe: string;
  mucDich: string;
  soTienDeXuat: number;
  nguoiNhan: string;
  duongDanMinhChung?: string;
  ghiChu?: string;
  trangThai: string;
  ngayTao: string;
  soPhieuDongY: number;
  soPhieuKhongDongY: number;
}

interface GiaoDich {
  maGiaoDich: number;
  loaiGiaoDich: 'THU' | 'CHI';
  soTien: number;
  moTa: string;
  nguoiThucHien: string;
  phuongThuc?: string;
  duongDanMinhChung?: string;
}

const extractData = (res: any) => {
  if (!res || !res.data) return [];
  if (Array.isArray(res.data)) return res.data;
  if (res.data.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

export const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'contributions' | 'proposals' | 'members'>('overview');
  const [groupInfo, setGroupInfo] = useState<NhomQuy | null>(null);
  const [members, setMembers] = useState<ThanhVien[]>([]);
  const [campaigns, setCampaigns] = useState<DotThu[]>([]);
  const [pendingPayments, setPendingPayments] = useState<KhoanNop[]>([]);
  const [proposals, setProposals] = useState<DeXuatChi[]>([]);
  const [ledger, setLedger] = useState<GiaoDich[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Bộ lọc cho Tab Sổ Cái
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerFilterType, setLedgerFilterType] = useState<'ALL' | 'THU' | 'CHI'>('ALL');

  // Trạng thái hiển thị Modals
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showPropModal, setShowPropModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Form State: Cấu hình nhóm
  const [editTenNhom, setEditTenNhom] = useState('');
  const [editMoTa, setEditMoTa] = useState('');
  const [editCheDoRiengTu, setEditCheDoRiengTu] = useState<'PUBLIC' | 'RIENG_TU'>('RIENG_TU');
  const [editMucTieuQuy, setEditMucTieuQuy] = useState<number | null>(null);
  const [editBatPheDuyet, setEditBatPheDuyet] = useState(true);
  const [editBatBieuQuyet, setEditBatBieuQuyet] = useState(false);
  const [editThoiHanBieuQuyetGio, setEditThoiHanBieuQuyetGio] = useState(24);

  // Dữ liệu đối tượng được chọn
  const [selectedCampaign, setSelectedCampaign] = useState<DotThu | null>(null);
  const [selectedMemberToRole, setSelectedMemberToRole] = useState<ThanhVien | null>(null);

  // Checkbox vai trò bổ sung (Chỉ có ADMIN và THỦ QUỸ)
  const [isRoleAdmin, setIsRoleAdmin] = useState(false);
  const [isRoleThuQuy, setIsRoleThuQuy] = useState(false);

  // State Form: Tạo đợt thu
  const [tenDotThu, setTenDotThu] = useState('');
  const [soTienBatBuoc, setSoTienBatBuoc] = useState<number>(100000);

  // State Form: Tạo thu (Nộp tiền)
  const [noiDungNop, setNoiDungNop] = useState('');
  const [soTienNop, setSoTienNop] = useState<number>(100000);
  const [phuongThucNop, setPhuongThucNop] = useState('BANK_TRANSFER');
  const [maThuQuyNhan, setMaThuQuyNhan] = useState<number | undefined>(undefined);
  const [minhChungNop, setMinhChungNop] = useState('');

  // State Form: Tạo chi
  const [tieuDeProp, setTieuDeProp] = useState('');
  const [mucDichProp, setMucDichProp] = useState('');
  const [soTienProp, setSoTienProp] = useState<number>(200000);
  const [nguoiNhanProp, setNguoiNhanProp] = useState('');
  const [maThuQuyDuyet, setMaThuQuyDuyet] = useState<number | undefined>(undefined);
  const [loaiHinhChi, setLoaiHinhChi] = useState('TAM_UNG');
  const [minhChungProp, setMinhChungProp] = useState('');

  const fetchAllData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    try {
      const resGroup = await axiosClient.get(`/groups/${id}`);
      const gData = resGroup.data?.data || resGroup.data;
      setGroupInfo(gData);

      const resMembers = await axiosClient.get(`/groups/${id}/members`);
      const memberList = extractData(resMembers);
      setMembers(memberList);

      if (memberList.length > 0) {
        const defaultOfficer = memberList.find((m: ThanhVien) => m.tenVaiTro === 'ADMIN' || m.tenVaiTro === 'THU_QUY') || memberList[0];
        setMaThuQuyNhan(defaultOfficer.maThanhVienNhom);
        setMaThuQuyDuyet(defaultOfficer.maThanhVienNhom);
      }

      try {
        const resCampaigns = await axiosClient.get(`/contributions/campaigns/group/${id}`);
        setCampaigns(extractData(resCampaigns));
      } catch {
        const resCampaigns = await axiosClient.get(`/contributions/campaigns?maNhom=${id}`);
        setCampaigns(extractData(resCampaigns));
      }

      try {
        const resPending = await axiosClient.get(`/contributions/pending?maNhom=${id}`);
        setPendingPayments(extractData(resPending));
      } catch {
        setPendingPayments([]);
      }

      try {
        const resProposals = await axiosClient.get(`/expenditures/proposals/group/${id}`);
        setProposals(extractData(resProposals));
      } catch {
        setProposals([]);
      }

      // Lấy sổ cái giao dịch
      try {
        const resLedger = await axiosClient.get(`/expenditures/ledger?maNhom=${id}`);
        setLedger(extractData(resLedger));
      } catch {
        setLedger([]);
      }
    } catch (e) {
      console.error('Lỗi nạp dữ liệu nhóm:', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Hàm chuyển File ảnh thành chuỗi Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setBase64Str: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước ảnh tối đa là 5MB!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Str(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyCode = () => {
    if (groupInfo?.maThamGia) {
      navigator.clipboard.writeText(groupInfo.maThamGia);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Mở Modal Cấu Hình
  const handleOpenSettingsModal = () => {
    if (groupInfo) {
      setEditTenNhom(groupInfo.tenNhom || '');
      setEditMoTa(groupInfo.moTa || '');
      setEditCheDoRiengTu((groupInfo.cheDoRiengTu as 'PUBLIC' | 'RIENG_TU') || 'RIENG_TU');
      setEditMucTieuQuy(groupInfo.mucTieuQuy ?? null);
      setEditBatPheDuyet(groupInfo.batPheDuyet ?? true);
      setEditBatBieuQuyet(groupInfo.batBieuQuyet ?? false);
      setEditThoiHanBieuQuyetGio(groupInfo.thoiHanBieuQuyetGio ?? 24);
      setShowSettingsModal(true);
    }
  };

  // Lưu Cấu Hình Nhóm
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.put(`/groups/${id}/settings`, {
        tenNhom: editTenNhom,
        moTa: editMoTa,
        cheDoRiengTu: editCheDoRiengTu,
        mucTieuQuy: editMucTieuQuy,
        batPheDuyet: editBatPheDuyet,
        batBieuQuyet: editBatPheDuyet ? editBatBieuQuyet : false,
        thoiHanBieuQuyetGio: editThoiHanBieuQuyetGio,
      });
      alert('Cập nhật cấu hình nhóm thành công!');
      setShowSettingsModal(false);
      fetchAllData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Chỉ Quản trị viên mới có quyền cập nhật cấu hình!');
    }
  };

  // 1. ĐÓNG NHÓM QUỸ
  const handleCloseGroup = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn đóng nhóm quỹ này không?')) return;
    try {
      await axiosClient.delete(`/groups/${id}`);
      alert('Đã đóng nhóm quỹ thành công!');
      navigate('/');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể đóng nhóm do chưa thỏa mãn điều kiện rào chắn!');
    }
  };

  // 2. RỜI NHÓM QUỸ
  const handleLeaveGroup = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn rời khỏi nhóm quỹ này không?')) return;
    try {
      await axiosClient.post(`/groups/${id}/leave`);
      alert('Bạn đã rời nhóm thành công!');
      navigate('/');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể rời nhóm do vướng rào chắn an toàn tài chính!');
    }
  };

  // 3. XÓA ĐỢT THU QUỸ
  const handleDeleteCampaign = async (maNghiaVu?: number) => {
    if (!maNghiaVu) {
      alert('Không tìm thấy mã đợt thu!');
      return;
    }
    if (!window.confirm('Bạn có chắc chắn muốn xóa đợt thu quỹ này không?')) return;

    try {
      await axiosClient.delete(`/contributions/campaigns/${maNghiaVu}`);
      alert('Xóa đợt thu thành công!');
      fetchAllData();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.response?.data || 'Lỗi khi xóa đợt thu!';
      alert(errorMsg);
    }
  };

  // 4. MỞ MODAL PHÂN ĐA VAI TRÒ
  const handleOpenRoleModal = (member: ThanhVien) => {
    setSelectedMemberToRole(member);
    
    const roles = member.danhSachVaiTro && member.danhSachVaiTro.length > 0 
      ? member.danhSachVaiTro 
      : [member.tenVaiTro];

    setIsRoleAdmin(roles.includes('ADMIN'));
    setIsRoleThuQuy(roles.includes('THU_QUY'));
    setShowRoleModal(true);
  };

  // 5. LƯU PHÂN ĐA VAI TRÒ
  const handleSaveMultiRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberToRole) return;

    const selectedRoles: string[] = [];
    if (isRoleAdmin) selectedRoles.push('ADMIN');
    if (isRoleThuQuy) selectedRoles.push('THU_QUY');

    try {
      await axiosClient.post(`/groups/${id}/assign-multi-role`, {
        maThanhVienNhom: selectedMemberToRole.maThanhVienNhom,
        danhSachVaiTro: selectedRoles,
      });
      setShowRoleModal(false);
      alert('Cập nhật vai trò thành công!');
      fetchAllData();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Chỉ Quản trị viên (ADMIN) mới có quyền phân bổ vai trò!';
      alert(errorMsg);
    }
  };

  // 6. TẠO ĐỢT THU QUỸ MỚI
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post('/contributions/campaigns', {
        maNhom: Number(id),
        tenNghiaVu: tenDotThu,
        soTienMacDinh: Number(soTienBatBuoc),
        hanDong: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setShowCampaignModal(false);
      setTenDotThu('');
      setSoTienBatBuoc(100000);
      alert('Tạo đợt thu thành công!');
      fetchAllData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể tạo đợt thu! Vui lòng kiểm tra lại.');
    }
  };

  // 7. MỞ VÀ TẠO THU (KHAI BÁO NỘP TIỀN)
  const handleOpenPayModal = (campaign?: DotThu) => {
    setMinhChungNop('');
    if (!maThuQuyNhan && members.length > 0) {
      const defaultOfficer = members.find((m) => m.tenVaiTro === 'ADMIN' || m.tenVaiTro === 'THU_QUY') || members[0];
      setMaThuQuyNhan(defaultOfficer.maThanhVienNhom);
    }
    if (campaign) {
      setSelectedCampaign(campaign);
      setNoiDungNop(`Nộp đợt thu: ${campaign.tenNghiaVu || campaign.tenDotThu}`);
      setSoTienNop(campaign.soTienMacDinh ?? campaign.soTienBatBuoc ?? 100000);
    } else {
      setSelectedCampaign(null);
      setNoiDungNop('Thành viên nộp quỹ tự nguyện');
      setSoTienNop(100000);
    }
    setShowPayModal(true);
  };

  const handleSubmitPay = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        maNhom: Number(id),
        maNghiaVu: selectedCampaign?.maNghiaVu || selectedCampaign?.maDotThu || null,
        noiDung: noiDungNop.trim(),
        soTien: Number(soTienNop),
        maThuQuyNhan: maThuQuyNhan ? Number(maThuQuyNhan) : null,
        phuongThuc: phuongThucNop || 'BANK_TRANSFER',
        duongDanMinhChung: minhChungNop || null,
      };

      await axiosClient.post('/contributions/pay', payload);
      
      setShowPayModal(false);
      setMinhChungNop('');
      alert('Tạo khoản thu thành công!');
      fetchAllData();
    } catch (err: any) {
      console.error('Lỗi khi tạo khoản thu:', err?.response?.data);
      const msg = err?.response?.data?.message || 'Không thể tạo khoản thu! Vui lòng kiểm tra lại.';
      alert(`Lỗi: ${msg}`);
    }
  };

  // 8. DUYỆT HOẶC TỪ CHỐI KHOẢN NỘP
  const handleApprovePayment = async (maKhoanNop: number, trangThai: 'DA_XAC_NHAN' | 'TU_CHOI') => {
    try {
      await axiosClient.post(`/contributions/approve/${maKhoanNop}`, {
        trangThai: trangThai,
        lyDoTuChoi: trangThai === 'TU_CHOI' ? 'Thủ quỹ từ chối xác nhận khoản nộp' : null,
      });
      alert(trangThai === 'DA_XAC_NHAN' ? 'Đã duyệt khoản thu!' : 'Đã từ chối khoản thu!');
      fetchAllData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể thực hiện thao tác duyệt!');
    }
  };

  // 9. MỞ VÀ TẠO CHI
  const handleOpenPropModal = () => {
    if (!maThuQuyDuyet && members.length > 0) {
      const defaultOfficer = members.find((m) => m.tenVaiTro === 'ADMIN' || m.tenVaiTro === 'THU_QUY') || members[0];
      setMaThuQuyDuyet(defaultOfficer.maThanhVienNhom);
    }
    setShowPropModal(true);
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        maNhom: Number(id),
        tieuDe: tieuDeProp.trim(),
        mucDich: mucDichProp ? mucDichProp.trim() : '',
        soTienDeXuat: Number(soTienProp),
        nguoiNhan: nguoiNhanProp ? nguoiNhanProp.trim() : '',
        maThuQuyDuyet: maThuQuyDuyet ? Number(maThuQuyDuyet) : null,
        loaiHinhChi: loaiHinhChi || 'TAM_UNG',
        phuongThuc: 'BANK_TRANSFER',
        duongDanMinhChung: minhChungProp || null,
        ghiChu: ''
      };

      await axiosClient.post('/expenditures/proposals', payload);
      
      setShowPropModal(false);
      setTieuDeProp('');
      setMucDichProp('');
      setSoTienProp(200000);
      setNguoiNhanProp('');
      setMinhChungProp('');
      alert('Tạo khoản chi thành công!');
      fetchAllData();
    } catch (err: any) {
      console.error('Lỗi khi tạo khoản chi:', err?.response?.data);
      const msg = err?.response?.data?.message || 'Không thể tạo khoản chi! Vui lòng kiểm tra lại.';
      alert(`Lỗi: ${msg}`);
    }
  };

  // 10. BIỂU QUYẾT & THỰC HIỆN CHI
  const handleVoteProposal = async (maDeXuat: number, luaChon: 'DONG_Y' | 'KHONG_DONG_Y') => {
    try {
      await axiosClient.post(`/expenditures/proposals/${maDeXuat}/vote`, { luaChon });
      alert('Gửi biểu quyết thành công!');
      fetchAllData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi gửi biểu quyết!');
    }
  };

  const handleExecuteExpenditure = async (maDeXuat: number) => {
    try {
      await axiosClient.post(`/expenditures/proposals/${maDeXuat}/execute`);
      alert('Thực hiện chi thành công!');
      fetchAllData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi thực hiện chi!');
    }
  };

  // Lọc dữ liệu Sổ Cái
  const filteredLedger = ledger.filter((gd) => {
    const matchSearch = (gd.moTa || '').toLowerCase().includes(ledgerSearch.toLowerCase()) ||
                        (gd.nguoiThucHien || '').toLowerCase().includes(ledgerSearch.toLowerCase());
    const matchType = ledgerFilterType === 'ALL' || gd.loaiGiaoDich === ledgerFilterType;
    return matchSearch && matchType;
  });

  const currencyUnit = groupInfo?.loaiTienTe || 'VND';

  if (loading && !groupInfo) {
    return <div className="text-center py-20 text-slate-400 text-xs font-semibold">Đang tải thông tin nhóm...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* HEADER & NÚT HÀNH ĐỘNG */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <button onClick={() => navigate('/')} className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách nhóm
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{groupInfo?.tenNhom}</h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              {groupInfo?.cheDoRiengTu === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{groupInfo?.moTa || 'Chưa có mô tả nhóm'}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleCopyCode} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Đã sao chép!' : `Mã: ${groupInfo?.maThamGia}`}
          </button>

          <button onClick={handleOpenSettingsModal} className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition">
            <Settings className="w-4 h-4 text-slate-500" /> Cấu hình nhóm
          </button>
          
          <button onClick={handleLeaveGroup} className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition">
            <LogOut className="w-4 h-4" /> Rời nhóm
          </button>

          <button onClick={handleCloseGroup} className="px-3 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition">
            <Power className="w-4 h-4 text-rose-400" /> Đóng nhóm
          </button>

          {/* ĐỒNG NHẤT NÚT TẠO THU VÀ TẠO CHI NẰM KẾ BÊN NHAU */}
          <button onClick={() => handleOpenPayModal()} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition">
            <Plus className="w-4 h-4" /> Tạo thu
          </button>
          
          <button onClick={handleOpenPropModal} className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition">
            <FileText className="w-4 h-4" /> Tạo chi
          </button>

          <button onClick={() => setShowCampaignModal(true)} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition">
            <Plus className="w-4 h-4" /> Tạo đợt thu
          </button>
        </div>
      </div>

      {/* THỐNG KÊ SỐ DƯ & MỤC TIÊU */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Số dư quỹ hiện tại</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {(groupInfo?.soDuHienTai ?? 0).toLocaleString()} {currencyUnit}
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mục tiêu quyên góp</span>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {groupInfo?.mucTieuQuy && groupInfo.mucTieuQuy > 0
              ? `${groupInfo.mucTieuQuy.toLocaleString()} ${currencyUnit}`
              : 'Không đặt mục tiêu'}
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Thành viên tham gia</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" /> {members.length} người
          </div>
        </div>
      </div>

      {/* TABS CHUYỂN ĐỔI GIAO DIỆN */}
      <div className="border-b border-slate-200 flex gap-6 text-xs font-bold">
        <button onClick={() => setActiveTab('overview')} className={`pb-3 border-b-2 transition ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          1. Nhật Ký Sổ Cái ({ledger.length})
        </button>
        <button onClick={() => setActiveTab('contributions')} className={`pb-3 border-b-2 transition ${activeTab === 'contributions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          2. Đợt Thu Quỹ ({campaigns.length})
        </button>
        <button onClick={() => setActiveTab('proposals')} className={`pb-3 border-b-2 transition ${activeTab === 'proposals' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          3. Biểu Quyết Chi ({proposals.length})
        </button>
        <button onClick={() => setActiveTab('members')} className={`pb-3 border-b-2 transition ${activeTab === 'members' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          4. Thành Viên & Phân Vai Trò ({members.length})
        </button>
      </div>

      {/* TAB 1: SỔ CÁI BỘ LỌC THỜI GIAN THỰC */}
      {activeTab === 'overview' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Sổ Cái Biến Động Số Dư Thời Gian Thực</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm nội dung / người thực hiện..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl text-xs font-semibold">
                <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
                <button onClick={() => setLedgerFilterType('ALL')} className={`px-2 py-0.5 rounded-lg ${ledgerFilterType === 'ALL' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-500'}`}>Tất cả</button>
                <button onClick={() => setLedgerFilterType('THU')} className={`px-2 py-0.5 rounded-lg ${ledgerFilterType === 'THU' ? 'bg-white shadow-xs text-emerald-600' : 'text-slate-500'}`}>Thu</button>
                <button onClick={() => setLedgerFilterType('CHI')} className={`px-2 py-0.5 rounded-lg ${ledgerFilterType === 'CHI' ? 'bg-white shadow-xs text-rose-600' : 'text-slate-500'}`}>Chi</button>
              </div>
            </div>
          </div>

          {filteredLedger.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-xs">Chưa có giao dịch phát sinh phù hợp.</p>
          ) : (
            <div className="space-y-2">
              {filteredLedger.map((gd) => (
                <div key={gd.maGiaoDich} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${gd.loaiGiaoDich === 'THU' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {gd.loaiGiaoDich === 'THU' ? '+ THU' : '- CHI'}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{gd.moTa}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Thực hiện: <span className="font-semibold text-slate-700">{gd.nguoiThucHien}</span> • {gd.phuongThuc || 'BANK_TRANSFER'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-extrabold ${gd.loaiGiaoDich === 'THU' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {gd.loaiGiaoDich === 'THU' ? '+' : '-'}{gd.soTien?.toLocaleString()} {currencyUnit}
                    </span>
                    {gd.duongDanMinhChung && (
                      <a href={gd.duongDanMinhChung} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 font-semibold hover:underline mt-0.5 flex items-center justify-end gap-1">
                        <ImageIcon className="w-3 h-3" /> Minh chứng
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ĐỢT THU & KHOẢN NỘP CHỜ DUYỆT */}
      {activeTab === 'contributions' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Danh Sách Các Đợt Thu Quỹ</h3>
            {campaigns.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Chưa có đợt thu quỹ nào.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {campaigns.map((c, idx) => {
                  const ma = c.maNghiaVu || c.maDotThu;
                  const ten = c.tenNghiaVu || c.tenDotThu;
                  const soTien = c.soTienMacDinh ?? c.soTienBatBuoc ?? 0;

                  return (
                    <div key={ma || idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{ten}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Số tiền: <span className="font-semibold text-emerald-600">{soTien.toLocaleString()} {currencyUnit}</span></p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenPayModal(c)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition">Nộp tiền đợt này</button>
                        <button onClick={() => handleDeleteCampaign(ma)} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition" title="Xóa đợt thu">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DÀNH CHO THỦ QUỸ: KHOẢN NỘP CHỜ DUYỆT */}
          {pendingPayments.length > 0 && (
            <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600" /> Khoản Nộp Chờ Thủ Quỹ / Admin Duyệt ({pendingPayments.length})
              </h3>
              <div className="space-y-2">
                {pendingPayments.map((kn) => (
                  <div key={kn.maKhoanNop} className="p-3 bg-white rounded-xl border border-amber-200 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{kn.ghiChu || 'Nộp quỹ'}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Nộp bởi: <span className="font-semibold text-slate-700">{kn.tenNguoiKhaiBao}</span> • Thủ quỹ nhận: <span className="font-semibold text-slate-700">{kn.tenThuQuyNhan}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-emerald-600">{kn.soTien?.toLocaleString()} {currencyUnit}</span>
                      <div className="flex gap-1">
                        <button onClick={() => handleApprovePayment(kn.maKhoanNop, 'DA_XAC_NHAN')} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700" title="Duyệt"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => handleApprovePayment(kn.maKhoanNop, 'TU_CHOI')} className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700" title="Từ chối"><XCircle className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ĐỀ XUẤT & BIỂU QUYẾT CHI */}
      {activeTab === 'proposals' && (
        <div className="space-y-3">
          {proposals.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-xs">Chưa có đề xuất chi nào.</p>
          ) : (
            proposals.map((p) => (
              <div key={p.maDeXuat} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{p.tieuDe}</h4>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${p.trangThai === 'DA_THANH_TOAN' ? 'bg-emerald-100 text-emerald-800' : p.trangThai === 'DA_DUYET' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                      {p.trangThai}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{p.mucDich}</p>
                  <p className="text-[10px] text-slate-400">Tạo bởi: {p.tenNguoiTao} • Nhận tiền: {p.nguoiNhan || 'N/A'}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-rose-600">{p.soTienDeXuat?.toLocaleString()} {currencyUnit}</span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5"><ThumbsUp className="w-3 h-3" /> {p.soPhieuDongY || 0}</span>
                      <span className="text-rose-600 font-bold flex items-center gap-0.5"><ThumbsDown className="w-3 h-3" /> {p.soPhieuKhongDongY || 0}</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    {p.trangThai === 'CHO_DUYET' && (
                      <>
                        <button onClick={() => handleVoteProposal(p.maDeXuat, 'DONG_Y')} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg">Đồng ý</button>
                        <button onClick={() => handleVoteProposal(p.maDeXuat, 'KHONG_DONG_Y')} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg">Bác bỏ</button>
                      </>
                    )}
                    {p.trangThai === 'DA_DUYET' && (
                      <button onClick={() => handleExecuteExpenditure(p.maDeXuat)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg">Chi tiền ngay</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: DANH SÁCH THÀNH VIÊN VÀ BẢNG PHÂN MULTI-ROLE */}
      {activeTab === 'members' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Danh Sách Thành Viên ({members.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {members.map((m, index) => (
              <div key={m.maThanhVienNhom || index} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">{m.hoTen || m.tenNguoiDung}</p>

                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(() => {
                      const roles = m.danhSachVaiTro && m.danhSachVaiTro.length > 0 
                        ? m.danhSachVaiTro 
                        : [m.tenVaiTro];
                      
                      const managementRoles = roles.filter(r => r === 'ADMIN' || r === 'THU_QUY');

                      if (managementRoles.length === 0) {
                        return (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            Thành viên
                          </span>
                        );
                      }

                      return managementRoles.map((role) => (
                        <span
                          key={role}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            role === 'ADMIN'
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {role === 'ADMIN' ? 'Quản trị viên' : 'Thủ quỹ'}
                        </span>
                      ));
                    })()}
                  </div>
                </div>

                {/* NÚT MỞ MODAL GÁN VAI TRÒ */}
                <button 
                  onClick={() => handleOpenRoleModal(m)} 
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-200 rounded-lg transition" 
                  title="Gán vai trò (Chỉ Admin)"
                >
                  <UserCheck className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL CẤU HÌNH NHÓM */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" /> Cấu Hình & Chính Sách Nhóm Quỹ
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên nhóm quỹ *</label>
                <input
                  type="text"
                  required
                  value={editTenNhom}
                  onChange={(e) => setEditTenNhom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả nhóm</label>
                <textarea
                  value={editMoTa}
                  onChange={(e) => setEditMoTa(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mục tiêu quỹ <span className="text-slate-400 font-normal">(Không bắt buộc)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Để trống nếu thu/chi tự do"
                    value={editMucTieuQuy ?? ''}
                    onChange={(e) => setEditMucTieuQuy(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chế độ hiển thị</label>
                  <select
                    value={editCheDoRiengTu}
                    onChange={(e) => setEditCheDoRiengTu(e.target.value as 'PUBLIC' | 'RIENG_TU')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="RIENG_TU">Riêng tư (Cần mã)</option>
                    <option value="PUBLIC">Công khai</option>
                  </select>
                </div>
              </div>

              {/* CHÍNH SÁCH PHÊ DUYỆT VÀ BIỂU QUYẾT */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Chính sách Phê duyệt & Biểu quyết</h4>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Bật Phê Duyệt Thu / Chi</span>
                    <span className="text-[11px] text-slate-500">Mọi bản thu/chi bắt buộc Thủ quỹ/Admin duyệt mới trừ số dư</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editBatPheDuyet}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEditBatPheDuyet(checked);
                      if (!checked) setEditBatBieuQuyet(false);
                    }}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    !editBatPheDuyet ? 'bg-slate-100 opacity-60' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Vote className="w-3.5 h-3.5 text-indigo-600" /> Yêu cầu Biểu quyết Khoản Chi
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Đề xuất chi phải &gt;50% thành viên vote Đồng ý trước khi tới Thủ quỹ
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!editBatPheDuyet}
                    checked={editBatBieuQuyet}
                    onChange={(e) => setEditBatBieuQuyet(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>

                {editBatBieuQuyet && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Thời hạn biểu quyết (giờ)</label>
                    <input
                      type="number"
                      value={editThoiHanBieuQuyetGio}
                      onChange={(e) => setEditThoiHanBieuQuyetGio(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition"
                >
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: TẠO ĐỢT THU QUỸ */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Tạo Đợt Thu Quỹ Mới</h3>
            <form onSubmit={handleCreateCampaign} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên đợt thu *</label>
                <input type="text" required value={tenDotThu} onChange={(e) => setTenDotThu(e.target.value)} placeholder="VD: Quỹ Tháng 10..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Số tiền mỗi người ({currencyUnit}) *</label>
                <input type="number" value={soTienBatBuoc} onChange={(e) => setSoTienBatBuoc(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowCampaignModal(false)} className="px-4 py-1.5 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100">Hủy</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Tạo đợt thu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TẠO THU (KHAI BÁO NỘP TIỀN QUỸ) */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Tạo Khoản Thu Quỹ</h3>
            <form onSubmit={handleSubmitPay} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nội dung / Lý do thu *</label>
                <input type="text" required value={noiDungNop} onChange={(e) => setNoiDungNop(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Số tiền ({currencyUnit}) *</label>
                  <input type="number" required value={soTienNop} onChange={(e) => setSoTienNop(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phương thức *</label>
                  <select value={phuongThucNop} onChange={(e) => setPhuongThucNop(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                    <option value="BANK_TRANSFER">Chuyển khoản Ngân hàng</option>
                    <option value="CASH">Tiền mặt</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Thủ Quỹ / Admin tiếp nhận *</label>
                <select value={maThuQuyNhan || ''} onChange={(e) => setMaThuQuyNhan(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                  {members.map((m) => (
                    <option key={m.maThanhVienNhom} value={m.maThanhVienNhom}>{m.hoTen || m.tenNguoiDung} ({m.tenVaiTro})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hình ảnh minh chứng (Biên lai / Đơn)</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setMinhChungNop)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-xl bg-slate-50 p-1"
                  />
                  {minhChungNop && (
                    <div className="relative w-28 h-28 rounded-xl border border-slate-200 overflow-hidden group">
                      <img src={minhChungNop} alt="Xem trước minh chứng" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setMinhChungNop('')}
                        className="absolute top-1 right-1 bg-slate-900/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowPayModal(false)} className="px-4 py-1.5 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100">Hủy</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">Tạo thu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TẠO CHI */}
      {showPropModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">Tạo Khoản Chi Quỹ</h3>
            <form onSubmit={handleCreateProposal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tiêu đề khoản chi *</label>
                <input type="text" required value={tieuDeProp} onChange={(e) => setTieuDeProp(e.target.value)} placeholder="VD: Mua văn phòng phẩm..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mục đích sử dụng chi tiết</label>
                <textarea value={mucDichProp} onChange={(e) => setMucDichProp(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Số tiền ({currencyUnit}) *</label>
                  <input type="number" required value={soTienProp} onChange={(e) => setSoTienProp(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Loại hình *</label>
                  <select value={loaiHinhChi} onChange={(e) => setLoaiHinhChi(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                    <option value="TAM_UNG">Xin ứng tiền trước</option>
                    <option value="HOAN_TIEN">Chi trước hoàn tiền túi</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Đơn vị / Người nhận tiền</label>
                <input type="text" value={nguoiNhanProp} onChange={(e) => setNguoiNhanProp(e.target.value)} placeholder="VD: Cửa hàng B, Nguyễn Văn A..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Thủ Quỹ chịu trách nhiệm chi *</label>
                <select value={maThuQuyDuyet || ''} onChange={(e) => setMaThuQuyDuyet(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                  {members.map((m) => (
                    <option key={m.maThanhVienNhom} value={m.maThanhVienNhom}>{m.hoTen || m.tenNguoiDung} ({m.tenVaiTro})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hình ảnh minh chứng (Hóa đơn / Biên lai)</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setMinhChungProp)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-xl bg-slate-50 p-1"
                  />
                  {minhChungProp && (
                    <div className="relative w-28 h-28 rounded-xl border border-slate-200 overflow-hidden group">
                      <img src={minhChungProp} alt="Xem trước minh chứng" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setMinhChungProp('')}
                        className="absolute top-1 right-1 bg-slate-900/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowPropModal(false)} className="px-4 py-1.5 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100">Hủy</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700">Tạo chi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PHÂN VAI TRÒ DẠNG CHECKBOX MULTI-ROLE */}
      {showRoleModal && selectedMemberToRole && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Phân Vai Trò Nhóm Quỹ</h3>
            <p className="text-xs text-slate-500 mb-4">Thành viên: <span className="font-bold text-slate-800">{selectedMemberToRole.hoTen || selectedMemberToRole.tenNguoiDung}</span></p>

            <form onSubmit={handleSaveMultiRole} className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="text-[11px] text-slate-400 font-semibold mb-2 uppercase">Chọn vai trò bổ sung:</p>
                <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-white rounded-lg transition">
                  <span className="text-xs font-bold text-slate-800">Quản Trị Viên (ADMIN)</span>
                  <input type="checkbox" checked={isRoleAdmin} onChange={(e) => setIsRoleAdmin(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                </label>
                <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-white rounded-lg transition">
                  <span className="text-xs font-bold text-slate-800">Thủ Quỹ (THỦ QUỸ)</span>
                  <input type="checkbox" checked={isRoleThuQuy} onChange={(e) => setIsRoleThuQuy(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" />
                </label>
              </div>

              <p className="text-[10px] text-slate-400 italic">* Mọi thành viên mặc định đều mang vai trò Thành Viên (MEMBER).</p>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowRoleModal(false)} className="px-4 py-1.5 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100">Hủy</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};