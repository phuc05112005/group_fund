import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Wallet, Users, Vote, History, PlusCircle, 
  CheckCircle2, XCircle, Clock,
  ArrowDownLeft, ArrowUpRight, Power, Shield, UserCheck, LogOut, Settings,
  X, Plus, Trash2, PieChart, Info,
  Receipt, RotateCcw, Copy, Check, ChevronLeft, ChevronRight, Search, CreditCard, Lock, Globe, User, ZoomIn,
  Eye, EyeOff, RefreshCw, Calendar, Hourglass, Image as ImageIcon, Upload,
  QrCode, AlertCircle, Loader2, Calculator
} from 'lucide-react';
import { apiService, localStore } from '../api/services';
import type { GroupFund, ThanhVienGroup, Proposal, Transaction, ExpenseTransaction, VoteItem } from '../api/services';
import axiosClient from '../api/axiosClient';

const getKieuPhanBoText = (kieu?: string): string => {
  switch (kieu) {
    case 'THU_DEU_TAT_CA': return 'Thu đều tất cả thành viên';
    case 'THU_DEU_NHO_LE': return 'Thu đều nhóm chỉ định';
    case 'NHAP_RIENG_TUNG_NGUOI': return 'Nhập riêng từng người';
    case 'CHI_NHIEU_NGUOI_CHUNG': return 'Chi chung cho nhóm';
    case 'CHI_NHIEU_NGUOI_RIENG': return 'Chi riêng từng người';
    case 'QUY_CHUNG': return 'Trừ số dư cá nhân tất cả thành viên (Chia đều)';
    case 'CHIA_DEU_CHON': return 'Trừ số dư cá nhân nhóm chỉ định';
    case 'SO_TIEN_RIENG': return 'Trừ số dư cá nhân tùy chỉnh';
    default: return kieu || 'Mặc định';
  }
};

const getRoleText = (role: string): string => {
  switch (role) {
    case 'QUAN_TRI': return 'Quản trị viên';
    case 'THU_QUY': return 'Thủ quỹ';
    case 'THANH_VIEN': return 'Thành viên';
    default: return role;
  }
};

const getPaymentMethodText = (method?: string): string => {
  switch (method) {
    case 'VNPAY': return 'Thanh toán VNPay (Tự động)';
    case 'CHUYEN_KHOAN': return 'Chuyển khoản VietQR';
    case 'TIEN_MAT': return 'Tiền mặt';
    default: return method || 'Khác';
  }
};

interface CustomMemberAllocation {
  thanhVienId: number | '';
  soTienPhanBo: string;
  ghiChu: string;
}

interface CustomExpenseAllocation {
  thanhVienId: number | '';
  soTienTru: string;
}

interface MergedHistoryItem {
  id: string;
  rawId: number;
  type: 'THU' | 'CHI';
  title: string;
  amount: number;
  personName: string;
  personEmail?: string;
  personId?: number;
  receiverName: string;
  receiverEmail?: string;
  receiverId?: number;
  method: string;
  status: string;
  date: Date;
  minhChung?: string;
  loaiPhanBo?: string;
  rawObject?: any;
}

export const GroupDetailPage: React.FC = () => {
  const { maNhom } = useParams<{ maNhom: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'overview' | 'proposals' | 'members'>('overview');
  const [proposalSubTab, setProposalSubTab] = useState<'ACTIVE' | 'EXPIRED'>('ACTIVE');

  const [group, setGroup] = useState<GroupFund | null>(null);
  const [members, setMembers] = useState<ThanhVienGroup[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [deposits, setDeposits] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<ThanhVienGroup | null>(null);
  const [currentKeycloakUserId, setCurrentKeycloakUserId] = useState<string>('');
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedStk, setCopiedStk] = useState(false);

  // Bộ lọc Ngày tháng
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  // Lọc Đề Xuất & Chi Tiết Vote
  const [proposalSearch, setProposalSearch] = useState('');
  const [proposalTypeFilter, setProposalTypeFilter] = useState('ALL');
  const [selectedProposalDetail, setSelectedProposalDetail] = useState<Proposal | null>(null);
  const [proposalVotesList, setProposalVotesList] = useState<VoteItem[]>([]);
  const [loadingVotes, setLoadingVotes] = useState(false);

  // Bộ Lọc & Tìm Kiếm Thành Viên
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('ALL');

  // Ngân Hàng & QR
  const [selectedMemberBank, setSelectedMemberBank] = useState<ThanhVienGroup | null>(null);
  const [enlargedQrUrl, setEnlargedQrUrl] = useState<string | null>(null);
  const [loadingReceiverBank, setLoadingReceiverBank] = useState(false);

  // Lịch Sử: Filter & Pagination
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('ALL');
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 8;
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState<MergedHistoryItem | null>(null);

  // Modals
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFundDetailModal, setShowFundDetailModal] = useState(false);
  const [showTreasurerFundsModal, setShowTreasurerFundsModal] = useState(false); // Modal chi tiết các Thủ quỹ giữ tiền
  const [selectedMemberRoleModal, setSelectedMemberRoleModal] = useState<ThanhVienGroup | null>(null);

  // Form Settings
  const [settingsTab, setSettingsTab] = useState<'INFO' | 'POLICY'>('INFO');
  const [editTenNhom, setEditTenNhom] = useState('');
  const [editMoTa, setEditMoTa] = useState('');
  const [editCheDoRiengTu, setEditCheDoRiengTu] = useState<'RIENG_TU' | 'CONG_KHAI'>('RIENG_TU');
  const [editMucTieuQuy, setEditMucTieuQuy] = useState('');
  const [tyLeDongYToiThieu, setTyLeDongYToiThieu] = useState(50);
  const [thoiGianHieuLucHours, setThoiGianHieuLucHours] = useState(24);
  const [anDanhNguoiVote, setAnDanhNguoiVote] = useState(false);

  // FORM ĐỀ XUẤT
  const [proposalType, setProposalType] = useState<'THU' | 'CHI'>('THU');
  const [tieuDeDeXuat, setTieuDeDeXuat] = useState('');
  const [mucDichDeXuat, setMucDichDeXuat] = useState('');
  const [soTienTongDeXuat, setSoTienTongDeXuat] = useState('');
  const [kieuPhanBo, setKieuPhanBo] = useState('THU_DEU_TAT_CA');
  const [coBieuQuyet, setCoBieuQuyet] = useState(true);
  const [kieuThanhVienBieuQuyet, setKieuThanhVienBieuQuyet] = useState<'TAT_CA' | 'CHI_DINH'>('TAT_CA');
  const [selectedVoterIds, setSelectedVoterIds] = useState<number[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [customAllocations, setCustomAllocations] = useState<CustomMemberAllocation[]>([
    { thanhVienId: '', soTienPhanBo: '', ghiChu: '' }
  ]);

  // FORM KHOẢN NỘP
  const [noiDungNop, setNoiDungNop] = useState('');
  const [soTienNop, setSoTienNop] = useState('10000');
  const [chiTietDeXuatNopId, setChiTietDeXuatNopId] = useState<number | undefined>(undefined);

  // FORM KHOẢN CHI
  const [noiDungChi, setNoiDungChi] = useState('');
  const [soTienChi, setSoTienChi] = useState('');
  const [phuongThucChi, setPhuongThucChi] = useState('CHUYEN_KHOAN');
  const [nguoiNhanChiId, setNguoiNhanChiId] = useState<number | ''>('');
  const [loaiNguonTienChi, setLoaiNguonTienChi] = useState<'QUY_CHUNG' | 'CHIA_DEU_CHON' | 'SO_TIEN_RIENG'>('QUY_CHUNG');
  const [chiTietDeXuatChiId, setChiTietDeXuatChiId] = useState<number | undefined>(undefined);
  const [selectedExpenseMemberIds, setSelectedExpenseMemberIds] = useState<number[]>([]);
  const [customExpenseAllocations, setCustomExpenseAllocations] = useState<CustomExpenseAllocation[]>([
    { thanhVienId: '', soTienTru: '' }
  ]);
  const [minhChungChi, setMinhChungChi] = useState<string>('');
  const [previewChiImage, setPreviewChiImage] = useState<string | null>(null);

  // FORM RÚT TIỀN / QUYẾT TOÁN
  const [soTienRut, setSoTienRut] = useState('');
  const [noiDungRut, setNoiDungRut] = useState('');

  const isThuQuy = currentUser?.danhSachVaiTro?.includes('THU_QUY');
  const isQuanTri = currentUser?.danhSachVaiTro?.includes('QUAN_TRI');

  // Tổng tiền tất cả Thủ quỹ đang tạm giữ trong nhóm này
  const tongTienThuQuyGiu = members.reduce((sum, m) => sum + (Number((m as any).soTienDangGiu) || 0), 0);

  const fetchPendingRequests = async () => {
    if (!maNhom || !isQuanTri) return;
    try {
      const res = await axiosClient.get(`/nhom-quy/${maNhom}/yeu-cau-tham-gia`);
      setPendingRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Lỗi tải danh sách yêu cầu chờ duyệt:', err);
    }
  };

  const handleProcessJoinRequest = async (maYeuCau: number, dongY: boolean) => {
    try {
      await axiosClient.post(`/nhom-quy/yeu-cau-tham-gia/${maYeuCau}/duyet?dongY=${dongY}`);
      triggerBanner(dongY ? 'Đã duyệt thành viên vào nhóm!' : 'Đã từ chối yêu cầu gia nhập.');
      fetchPendingRequests();
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Xử lý yêu cầu thất bại!');
      fetchPendingRequests();
    }
  };

  useEffect(() => {
    if (isQuanTri) {
      fetchPendingRequests();
    }
  }, [maNhom, isQuanTri]);

  useEffect(() => {
    if (kieuPhanBo === 'NHAP_RIENG_TUNG_NGUOI' || kieuPhanBo === 'CHI_NHIEU_NGUOI_RIENG') {
      const sum = customAllocations.reduce((acc, row) => {
        const val = parseFloat(row.soTienPhanBo);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      setSoTienTongDeXuat(sum > 0 ? sum.toString() : '');
    }
  }, [customAllocations, kieuPhanBo]);

  useEffect(() => {
    if (loaiNguonTienChi === 'SO_TIEN_RIENG') {
      const sum = customExpenseAllocations.reduce((acc, row) => {
        const val = parseFloat(row.soTienTru);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      setSoTienChi(sum > 0 ? sum.toString() : '');
    }
  }, [customExpenseAllocations, loaiNguonTienChi]);

  const triggerBanner = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => setBannerMessage(null), 6000);
  };

  const getMemberBankDetails = (member: ThanhVienGroup | null) => {
    if (!member) return { qrUrl: null, stk: '', bank: '', chuTk: '' };
    
    const isMe = member.email === currentUserProfile?.email 
              || member.maThanhVienNhom === currentUser?.maThanhVienNhom
              || member.nguoiDung?.email === currentUserProfile?.email;

    const m = member as any;
    const nd = member.nguoiDung as any;
    const tknh = m.taiKhoanNganHang || m.thongTinNganHang;

    const qrUrl = nd?.qrThanhToanUrl 
               || nd?.qrCode 
               || nd?.qrUrl 
               || m.qrThanhToanUrl 
               || m.qrCode 
               || m.qrUrl 
               || m.imageQr
               || tknh?.qrThanhToanUrl 
               || tknh?.qrCode
               || (isMe ? (currentUserProfile?.qrThanhToanUrl || currentUserProfile?.qrCode) : null);

    const bank = nd?.tenNganHang 
              || nd?.bankName 
              || m.tenNganHang 
              || m.bankName 
              || tknh?.tenNganHang 
              || (isMe ? currentUserProfile?.tenNganHang : '');

    const stk = nd?.soTaiKhoan 
             || nd?.stk 
             || nd?.accountNumber 
             || m.soTaiKhoan 
             || m.stk 
             || m.accountNumber 
             || tknh?.soTaiKhoan 
             || (isMe ? currentUserProfile?.soTaiKhoan : '');

    const chuTk = nd?.tenChuTaiKhoan 
               || nd?.accountHolder 
               || m.tenChuTaiKhoan 
               || m.chuTaiKhoan 
               || tknh?.tenChuTaiKhoan 
               || (isMe ? (currentUserProfile?.tenChuTaiKhoan || currentUser?.hoTen) : (member.hoTen || nd?.hoTen));

    return { qrUrl, stk, bank, chuTk };
  };

  useEffect(() => {
    if (!nguoiNhanChiId) return;

    const targetMember = members.find(m => m.maThanhVienNhom === Number(nguoiNhanChiId));
    if (!targetMember) return;

    const { stk, bank, qrUrl } = getMemberBankDetails(targetMember);
    const isMe = targetMember.email === currentUserProfile?.email 
              || targetMember.maThanhVienNhom === currentUser?.maThanhVienNhom;

    if (!isMe && (!stk || !bank || !qrUrl)) {
      setLoadingReceiverBank(true);
      const userId = targetMember.nguoiDung?.maNguoiDung 
                  || (targetMember as any).nguoiDungId 
                  || (targetMember as any).maNguoiDung 
                  || (targetMember as any).userId 
                  || targetMember.maThanhVienNhom;

      const fetchTargetProfile = async () => {
        try {
          const res = await axiosClient.get(`/nguoi-dung/${userId}`);
          if (res.data) {
            setMembers(prev => prev.map(m => {
              if (m.maThanhVienNhom === targetMember.maThanhVienNhom) {
                return {
                  ...m,
                  nguoiDung: { ...m.nguoiDung, ...res.data },
                  ...res.data
                };
              }
              return m;
            }));
          }
        } catch (e) {
          try {
            const res2 = await axiosClient.get(`/thanh-vien-nhom/${targetMember.maThanhVienNhom}`);
            if (res2.data) {
              setMembers(prev => prev.map(m => {
                if (m.maThanhVienNhom === targetMember.maThanhVienNhom) {
                  return { ...m, ...res2.data };
                }
                return m;
              }));
            }
          } catch (err2) {
            console.error('Không thể tải thông tin ngân hàng thành viên:', err2);
          }
        } finally {
          setLoadingReceiverBank(false);
        }
      };

      fetchTargetProfile();
    }
  }, [nguoiNhanChiId]);

  useEffect(() => {
    if (!selectedMemberBank) return;

    const { stk, bank, qrUrl } = getMemberBankDetails(selectedMemberBank);
    const isMe = selectedMemberBank.email === currentUserProfile?.email 
              || selectedMemberBank.maThanhVienNhom === currentUser?.maThanhVienNhom;

    if (!isMe && (!stk || !bank || !qrUrl)) {
      const userId = selectedMemberBank.nguoiDung?.maNguoiDung 
                  || (selectedMemberBank as any).nguoiDungId 
                  || (selectedMemberBank as any).maNguoiDung 
                  || (selectedMemberBank as any).userId 
                  || selectedMemberBank.maThanhVienNhom;

      axiosClient.get(`/nguoi-dung/${userId}`)
        .then(res => {
          if (res.data) {
            const updated = {
              ...selectedMemberBank,
              nguoiDung: { ...selectedMemberBank.nguoiDung, ...res.data },
              ...res.data
            };
            setSelectedMemberBank(updated);
            setMembers(prev => prev.map(m => m.maThanhVienNhom === selectedMemberBank.maThanhVienNhom ? updated : m));
          }
        })
        .catch(err => console.error('Lỗi lấy thông tin ngân hàng thành viên:', err));
    }
  }, [selectedMemberBank?.maThanhVienNhom]);

  const fetchVotesForProposal = async (propId: number): Promise<VoteItem[]> => {
    const localVotes = localStore.getVotes(propId);
    let serverVotes: VoteItem[] = [];
    try {
      const res = await axiosClient.get(`/de-xuat/${propId}`);
      if (res.data) {
        serverVotes = res.data.danhSachPhieuBau || res.data.phieuBaus || res.data.danhSachPhieu || [];
      }
    } catch (e) {
      // Fallback
    }

    const combined = [...localVotes, ...serverVotes];
    return combined.filter((v, i, a) => 
      a.findIndex(t => (t.maThanhVien || t.thanhVienId) === (v.maThanhVien || v.thanhVienId)) === i
    );
  };

  const fetchData = async () => {
    if (!maNhom) return;
    try {
      setLoading(true);

      const [groupRes, membersRes, proposalsRes, profileRes, transactionsRes, expensesRes, policyRes] = await Promise.all([
        apiService.getGroupDetail(maNhom),
        apiService.getMembersInGroup(maNhom).catch(() => ({ data: [] })),
        apiService.getProposalsInGroup(maNhom).catch(() => ({ data: [] })),
        apiService.getProfile().catch(() => ({ data: null })),
        apiService.getTransactionsByGroup(maNhom).catch(() => ({ data: [] })),
        apiService.getExpensesByGroup(maNhom).catch(() => ({ data: [] })),
        apiService.getVotingPolicy(maNhom).catch(() => ({ data: null }))
      ]);

      setGroup(groupRes.data);
      setEditTenNhom(groupRes.data.tenNhom || '');
      setEditMoTa(groupRes.data.moTa || '');
      setEditCheDoRiengTu((groupRes.data.cheDoRiengTu as any) || 'RIENG_TU');
      setEditMucTieuQuy(groupRes.data.mucTieuQuy ? groupRes.data.mucTieuQuy.toString() : '');

      if (policyRes.data) {
        setTyLeDongYToiThieu(policyRes.data.tyLeDongYToiThieu || 50);
        setThoiGianHieuLucHours(policyRes.data.thoiGianHieuLucHours || 24);
        
        const pData = policyRes.data as any;
        const isAnonBackend = pData?.anDanhNguoiVote ?? pData?.anDanh ?? pData?.coAnDanh ?? pData?.isAnonymous ?? pData?.an_danh_nguoi_vote;
        
        const storedAnon = localStorage.getItem(`groupfund_policy_anon_${maNhom}`);
        const isAnon = storedAnon !== null ? storedAnon === 'true' : Boolean(isAnonBackend);
        
        setAnDanhNguoiVote(isAnon);
      }

      const rawMemberList = Array.isArray(membersRes.data) ? membersRes.data : [];
      const memberList = rawMemberList.map((m: any) => {
        let roles: string[] = [];
        if (Array.isArray(m.danhSachVaiTro) && m.danhSachVaiTro.length > 0) {
          roles = m.danhSachVaiTro;
        } else if (Array.isArray(m.vaiTros)) {
          roles = m.vaiTros.map((v: any) => v.tenVaiTro || v);
        } else {
          roles = ['THANH_VIEN'];
        }
        return { ...m, danhSachVaiTro: roles };
      });

      setMembers(memberList);
      setProposals(Array.isArray(proposalsRes.data) ? proposalsRes.data : []);

      const serverDeposits = Array.isArray(transactionsRes.data) ? transactionsRes.data : [];
      const localDeposits = localStore.getDeposits(maNhom);
      setDeposits([...localDeposits, ...serverDeposits]);

      const serverExpenses = Array.isArray(expensesRes.data) ? expensesRes.data : [];
      const localExpenses = localStore.getExpenses(maNhom);
      setExpenses([...localExpenses, ...serverExpenses]);

      if (profileRes.data) {
        setCurrentUserProfile(profileRes.data);
        setCurrentKeycloakUserId(profileRes.data.keycloakUserId);
        if (memberList.length > 0) {
          const me = memberList.find(
            m => m.email === profileRes.data.email || m.nguoiDung?.email === profileRes.data.email
          );
          if (me) setCurrentUser(me);
        }
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu nhóm:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [maNhom]);

  const handleOpenProposalDetail = async (prop: Proposal) => {
    setSelectedProposalDetail(prop);
    setLoadingVotes(true);
    try {
      const votes = await fetchVotesForProposal(prop.maDeXuat);
      setProposalVotesList(votes);
    } catch (e) {
      setProposalVotesList([]);
    } finally {
      setLoadingVotes(false);
    }
  };

  const mergedHistory: MergedHistoryItem[] = [
    ...deposits.map(d => {
      const payerId = (d as any).nguoiNopId || (d as any).nguoiNop?.maThanhVienNhom;
      const foundPayer = members.find(m => m.maThanhVienNhom === payerId);

      const payerName = foundPayer?.hoTen 
                     || foundPayer?.nguoiDung?.hoTen 
                     || (d as any).nguoiNop?.nguoiDung?.hoTen 
                     || (d as any).nguoiNop?.hoTen 
                     || d.tenThanhVien 
                     || d.nguoiNopName 
                     || 'Thành viên';

      const payerEmail = foundPayer?.email 
                      || foundPayer?.nguoiDung?.email 
                      || (d as any).nguoiNop?.nguoiDung?.email 
                      || (d as any).nguoiNop?.email 
                      || '';

      const numId = d.maKhoanNop || Number(d.id) || Math.random();

      // FIX CHÍNH XÁC: Tên người nhận là tên Quỹ của Nhóm hiện tại
      const groupReceiverName = group?.tenNhom ? `Quỹ ${group.tenNhom}` : 'Quỹ nhóm';

      return {
        id: `dep-${numId}`,
        rawId: typeof numId === 'number' ? numId : 0,
        type: 'THU' as const,
        title: d.noiDung || 'Khoản nộp quỹ (VNPay)',
        amount: d.soTien || 0,
        personName: payerName,
        personEmail: payerEmail,
        personId: payerId,
        receiverName: groupReceiverName,
        method: getPaymentMethodText(d.phuongThuc || 'VNPAY'),
        status: d.trangThai || 'DA_XAC_NHAN',
        date: d.ngayKhaiBao ? new Date(d.ngayKhaiBao) : (d.ngayNop ? new Date(d.ngayNop) : new Date()),
        minhChung: d.minhChung,
        rawObject: d
      };
    }),
    ...expenses.map(e => {
      const rawExp = e as any;
      
      const thuQuyId = rawExp.thuQuyThucHienId || rawExp.thuQuyThucHien?.maThanhVienNhom;
      const foundThuQuy = members.find(m => m.maThanhVienNhom === thuQuyId);

      const payerName = foundThuQuy?.hoTen 
                     || foundThuQuy?.nguoiDung?.hoTen 
                     || rawExp.thuQuyThucHien?.nguoiDung?.hoTen 
                     || rawExp.thuQuyThucHien?.hoTen 
                     || e.thuQuyThucHienName 
                     || e.tenNguoiChi 
                     || 'Thủ quỹ đại diện';

      const payerEmail = foundThuQuy?.email 
                      || foundThuQuy?.nguoiDung?.email 
                      || rawExp.thuQuyThucHien?.nguoiDung?.email 
                      || rawExp.thuQuyThucHien?.email 
                      || '';

      const firstDetail = rawExp.danhSachChiTiet?.[0];
      const recObj = firstDetail?.nguoiNhanChi;
      const recId = rawExp.nguoiNhanChiId || recObj?.maThanhVienNhom || firstDetail?.thanhVienId;
      const foundRec = members.find(m => m.maThanhVienNhom === recId);

      const recName = foundRec?.hoTen 
                   || foundRec?.nguoiDung?.hoTen 
                   || recObj?.nguoiDung?.hoTen 
                   || recObj?.hoTen 
                   || e.nguoiNhanChiName 
                   || 'Thành viên thụ hưởng';

      const recEmail = foundRec?.email 
                    || foundRec?.nguoiDung?.email 
                    || recObj?.nguoiDung?.email 
                    || recObj?.email 
                    || '';

      const numId = e.maKhoanChi || e.maChiTietKhoanChi || Number(e.id) || Math.random();

      return {
        id: `exp-${numId}`,
        rawId: typeof numId === 'number' ? numId : 0,
        type: 'CHI' as const,
        title: e.noiDung || e.noiDungChi || 'Khoản chi quỹ',
        amount: e.soTienTong || e.soTien || 0,
        personName: payerName,
        personEmail: payerEmail,
        personId: thuQuyId,
        receiverName: recName,
        receiverEmail: recEmail,
        receiverId: recId,
        method: getPaymentMethodText(e.phuongThuc),
        status: e.trangThai || 'CHO_XAC_NHAN',
        date: e.ngayChi ? new Date(e.ngayChi) : (e.ngayTao ? new Date(e.ngayTao) : new Date()),
        minhChung: e.minhChung,
        loaiPhanBo: e.loaiPhanBo,
        rawObject: e
      };
    })
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  useEffect(() => {
    const deXuatId = searchParams.get('deXuatId');
    const giaoDichId = searchParams.get('giaoDichId');

    if (deXuatId) {
      setActiveTab('proposals');
      const numDeXuatId = Number(deXuatId);
      const foundProp = proposals.find(p => p.maDeXuat === numDeXuatId);
      
      if (foundProp) {
        handleOpenProposalDetail(foundProp);
      } else if (!loading) {
        axiosClient.get(`/de-xuat/${numDeXuatId}`).then(res => {
          if (res.data) handleOpenProposalDetail(res.data);
        }).catch(err => console.error('Không tìm thấy đề xuất:', err));
      }
    } else if (giaoDichId) {
      setActiveTab('overview');
      const numGiaoDichId = Number(giaoDichId);
      const foundHist = mergedHistory.find(h => h.rawId === numGiaoDichId);
      if (foundHist) {
        setSelectedTransactionDetail(foundHist);
      }
    }
  }, [searchParams, proposals.length, deposits.length, expenses.length, loading]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStk(true);
    setTimeout(() => setCopiedStk(false), 2000);
  };

  const handleChiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setMinhChungChi(base64String);
        setPreviewChiImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const tongTienVao = deposits
    .filter(d => d.trangThai === 'DA_XAC_NHAN' || !d.trangThai)
    .reduce((sum, d) => sum + (d.soTien || 0), 0);

  const tongTienRa = expenses
    .filter(e => e.trangThai === 'DA_XAC_NHAN' || !e.trangThai)
    .reduce((sum, e) => sum + (e.soTienTong || e.soTien || 0), 0);

  const soDuQuyHienTai = group?.soDuQuy || 0;

  const filteredMembers = members.filter(m => {
    const matchesSearch = (m.hoTen || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
                          (m.email || '').toLowerCase().includes(memberSearch.toLowerCase());
    const matchesRole = memberRoleFilter === 'ALL' || m.danhSachVaiTro?.includes(memberRoleFilter);
    return matchesSearch && matchesRole;
  });

  const filteredHistory = mergedHistory.filter(h => {
    const matchesSearch = h.title.toLowerCase().includes(historySearch.toLowerCase()) ||
                          h.personName.toLowerCase().includes(historySearch.toLowerCase()) ||
                          h.receiverName.toLowerCase().includes(historySearch.toLowerCase());
    const matchesType = historyTypeFilter === 'ALL' || h.type === historyTypeFilter;

    let matchesDate = true;
    if (startDateFilter) {
      matchesDate = matchesDate && h.date >= new Date(startDateFilter);
    }
    if (endDateFilter) {
      const eDate = new Date(endDateFilter);
      eDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && h.date <= eDate;
    }

    return matchesSearch && matchesType && matchesDate;
  });

  const totalHistoryPages = Math.ceil(filteredHistory.length / historyPerPage) || 1;
  const paginatedHistory = filteredHistory.slice(
    (historyPage - 1) * historyPerPage,
    historyPage * historyPerPage
  );

  const getProposalCalculatedInfo = (prop: Proposal) => {
    const hasVoting = prop.coBieuQuyet !== false;
    
    const localVotes = localStore.getVotes(prop.maDeXuat);
    const combinedVotes = [...localVotes, ...(prop.danhSachPhieuBau || [])];
    const votesList = combinedVotes.filter((v, i, a) => 
      a.findIndex(t => (t.maThanhVien || t.thanhVienId) === (v.maThanhVien || v.thanhVienId)) === i
    );

    const agreeVotesCount = votesList.filter(v => v.dongY || v.luaChon === 'DONG_Y').length;
    const totalGroupMembers = members.length || 1;
    const agreePercent = Math.round((agreeVotesCount / totalGroupMembers) * 100);
    const minRequiredPercent = prop.tyLeToiThieu ?? tyLeDongYToiThieu ?? 50;

    const effectiveHours = (prop as any).thoiGianHieuLucHours || thoiGianHieuLucHours || 24;
    const createdTime = prop.ngayTao ? new Date(prop.ngayTao).getTime() : Date.now();
    const expiryTime = createdTime + effectiveHours * 3600 * 1000;
    const isExpired = Date.now() > expiryTime;
    const isFullyVoted = votesList.length >= totalGroupMembers;

    let statusText = 'Đang biểu quyết';
    let statusBgClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    let isApproved = false;
    let isRejected = false;

    const isCancelledOrRejected = prop.trangThai === 'HUY' || prop.trangThai === 'TU_CHOI' || prop.trangThai === 'DA_HUY';

    if (isCancelledOrRejected) {
      statusText = 'Đã hủy / Từ chối';
      statusBgClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      isRejected = true;
    } else if (isExpired) {
      statusText = 'Đã hết hạn';
      statusBgClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      isRejected = true;
    } else if (!hasVoting) {
      statusText = 'Thông báo (Khỏi biểu quyết)';
      statusBgClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      isApproved = true;
    } else if (agreePercent >= minRequiredPercent) {
      statusText = 'Đã thông qua';
      statusBgClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      isApproved = true;
    } else if (isFullyVoted && agreePercent < minRequiredPercent) {
      statusText = 'Bị từ chối';
      statusBgClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      isRejected = true;
    }

    return {
      hasVoting,
      votesList,
      agreeVotesCount,
      totalGroupMembers,
      agreePercent,
      minRequiredPercent,
      expiryTime,
      isExpired,
      isFullyVoted,
      statusText,
      statusBgClass,
      isApproved: isApproved && !isExpired,
      isRejected
    };
  };

  const filterProposalByDate = (p: Proposal) => {
    const pDate = p.ngayTao ? new Date(p.ngayTao) : new Date();
    let matchesDate = true;
    if (startDateFilter) {
      matchesDate = matchesDate && pDate >= new Date(startDateFilter);
    }
    if (endDateFilter) {
      const eDate = new Date(endDateFilter);
      eDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && pDate <= eDate;
    }
    return matchesDate;
  };

  const activeProposals = proposals.filter(p => {
    const info = getProposalCalculatedInfo(p);
    const matchesSearch = (p.tieuDe || p.tenDeXuat || '').toLowerCase().includes(proposalSearch.toLowerCase()) ||
                          (p.mucDich || p.moTa || '').toLowerCase().includes(proposalSearch.toLowerCase());
    const matchesType = proposalTypeFilter === 'ALL' || p.loaiDeXuat === proposalTypeFilter;
    return matchesSearch && matchesType && !info.isRejected && !info.isExpired && filterProposalByDate(p);
  });

  const expiredProposals = proposals.filter(p => {
    const info = getProposalCalculatedInfo(p);
    const matchesSearch = (p.tieuDe || p.tenDeXuat || '').toLowerCase().includes(proposalSearch.toLowerCase());
    const matchesType = proposalTypeFilter === 'ALL' || p.loaiDeXuat === proposalTypeFilter;
    return matchesSearch && matchesType && (info.isRejected || info.isExpired) && filterProposalByDate(p);
  });

  const handleOpenDepositForProposal = (prop: Proposal) => {
    const list = prop.chiTietList || prop.danhSachChiTiet || [];
    const myAllocation = list.find((ct: any) => 
      ct.thanhVienId === currentUser?.maThanhVienNhom ||
      ct.thanhVienNhom?.maThanhVienNhom === currentUser?.maThanhVienNhom
    );

    if (myAllocation && myAllocation.maChiTietDeXuat) {
      setChiTietDeXuatNopId(myAllocation.maChiTietDeXuat);
      const amountToPay = Math.max(myAllocation.soTienPhanBo || 10000, 10000);
      setSoTienNop(amountToPay.toString());
    } else {
      setChiTietDeXuatNopId(undefined); 
      const rawAmount = prop.soTienTong / (members.length || 1);
      const amountToPay = Math.max(rawAmount || 10000, 10000);
      setSoTienNop(amountToPay.toString());
    }

    setNoiDungNop(`Nộp tiền theo đề xuất: ${prop.tieuDe || prop.tenDeXuat}`);
    setShowDepositModal(true);
  };

  const handleOpenExpenseForProposal = (prop: Proposal) => {
    if (!isThuQuy) {
      alert('Chỉ Thủ quỹ mới có quyền tạo Khoản Chi!');
      return;
    }
    const firstDetail = prop.danhSachChiTiet?.[0];
    
    setChiTietDeXuatChiId(firstDetail?.maChiTietDeXuat || prop.maDeXuat);
    setSoTienChi(prop.soTienTong ? prop.soTienTong.toString() : '');
    setNoiDungChi(`Chi tiền theo đề xuất: ${prop.tieuDe || prop.tenDeXuat}`);
    if (firstDetail?.thanhVienId) {
      setNguoiNhanChiId(firstDetail.thanhVienId);
    }

    setShowExpenseModal(true);
  };

  const handleOpenSettings = async () => {
    if (!maNhom) return;
    try {
      const res = await apiService.getVotingPolicy(maNhom);
      if (res.data) {
        setTyLeDongYToiThieu(res.data.tyLeDongYToiThieu || 50);
        setThoiGianHieuLucHours(res.data.thoiGianHieuLucHours || 24);
        
        const pData = res.data as any;
        const isAnonBackend = pData?.anDanhNguoiVote ?? pData?.anDanh ?? pData?.coAnDanh ?? pData?.isAnonymous ?? pData?.an_danh_nguoi_vote;
        
        const storedAnon = localStorage.getItem(`groupfund_policy_anon_${maNhom}`);
        const isAnon = storedAnon !== null ? storedAnon === 'true' : Boolean(isAnonBackend);

        setAnDanhNguoiVote(isAnon);
      }
    } catch (e) {
      console.error('Lỗi tải chính sách biểu quyết:', e);
    }
    setShowSettingsModal(true);
  };

  const handleSaveGroupInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maNhom) return;
    try {
      await apiService.updateGroup(maNhom, {
        tenNhom: editTenNhom,
        moTa: editMoTa,
        cheDoRiengTu: editCheDoRiengTu,
        mucTieuQuy: parseFloat(editMucTieuQuy) || 0,
      });
      triggerBanner('Cập nhật thông tin nhóm thành công!');
      fetchData();
      setShowSettingsModal(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Cập nhật thất bại!');
    }
  };

  const handleSaveVotingPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maNhom) return;

    localStorage.setItem(`groupfund_policy_anon_${maNhom}`, String(anDanhNguoiVote));

    try {
      await apiService.updateVotingPolicy(maNhom, {
        tyLeDongYToiThieu,
        thoiGianHieuLucHours,
        anDanhNguoiVote,
        anDanh: anDanhNguoiVote,
        coAnDanh: anDanhNguoiVote,
        isAnonymous: anDanhNguoiVote,
        an_danh_nguoi_vote: anDanhNguoiVote
      } as any);
    } catch (err: any) {
      console.warn('Backend chưa hỗ trợ lưu ẩn danh, đã lưu cục bộ:', err);
    }

    triggerBanner('Đã lưu cấu hình biểu quyết!');
    setShowSettingsModal(false);
    await fetchData();
  };

  const handleCloseGroup = async () => {
    if (!window.confirm('XÁC NHẬN: Bạn có chắc chắn muốn ĐÓNG nhóm quỹ này?')) return;
    try {
      await axiosClient.put(`/nhom-quy/${maNhom}/dong-nhom`);
      alert('Đã đóng nhóm quỹ thành công!');
      navigate('/');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể đóng nhóm!');
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn RỜI KHỎI nhóm quỹ này?')) return;
    try {
      await axiosClient.post(`/nhom-quy/${maNhom}/roi-nhom`);
      alert('Đã rời khỏi nhóm thành công!');
      navigate('/');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể rời nhóm!');
    }
  };

  const handleAssignRole = async (maThanhVien: number, vaiTro: string) => {
    try {
      await apiService.assignRole(maThanhVien, vaiTro);
      setMembers(prevMembers =>
        prevMembers.map(m => {
          if (m.maThanhVienNhom === maThanhVien) {
            let currentRoles = m.danhSachVaiTro ? [...m.danhSachVaiTro] : ['THANH_VIEN'];
            if (vaiTro === 'THANH_VIEN') {
              currentRoles = ['THANH_VIEN'];
            } else {
              if (currentRoles.includes(vaiTro)) {
                currentRoles = currentRoles.filter(r => r !== vaiTro);
              } else {
                currentRoles.push(vaiTro);
              }
              if (!currentRoles.includes('THANH_VIEN')) {
                currentRoles.push('THANH_VIEN');
              }
            }
            return { ...m, danhSachVaiTro: currentRoles };
          }
          return m;
        })
      );

      triggerBanner(`Đã cập nhật vai trò thành công!`);
      setSelectedMemberRoleModal(null);
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Cập nhật vai trò thất bại!');
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maNhom || !tieuDeDeXuat) return;

    if (coBieuQuyet && kieuThanhVienBieuQuyet === 'CHI_DINH' && selectedVoterIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 thành viên được quyền bỏ phiếu!');
      return;
    }

    const totalAmount = parseFloat(soTienTongDeXuat || '0');
    let chiTietPayload: Array<{ thanhVienId: number; soTienPhanBo: number; ghiChu?: string }> = [];

    if (kieuPhanBo === 'THU_DEU_TAT_CA') {
      const perPerson = members.length > 0 ? totalAmount / members.length : totalAmount;
      chiTietPayload = members.map(m => ({
        thanhVienId: m.maThanhVienNhom,
        soTienPhanBo: perPerson,
        ghiChu: 'Thu đều tất cả thành viên'
      }));
    } else if (kieuPhanBo === 'THU_DEU_NHO_LE') {
      if (selectedMemberIds.length === 0) {
        alert('Vui lòng chọn ít nhất 1 thành viên tham gia!');
        return;
      }
      const splitAmount = totalAmount / selectedMemberIds.length;
      chiTietPayload = selectedMemberIds.map(id => ({
        thanhVienId: id,
        soTienPhanBo: splitAmount,
        ghiChu: 'Chia đều nhóm chỉ định'
      }));
    } else if (kieuPhanBo === 'NHAP_RIENG_TUNG_NGUOI' || kieuPhanBo === 'CHI_NHIEU_NGUOI_RIENG') {
      const validRows = customAllocations.filter(r => r.thanhVienId !== '' && parseFloat(r.soTienPhanBo) > 0);
      if (validRows.length === 0) {
        alert('Vui lòng chọn thành viên và nhập số tiền phân bổ cụ thể!');
        return;
      }

      chiTietPayload = validRows.map(r => ({
        thanhVienId: Number(r.thanhVienId),
        soTienPhanBo: parseFloat(r.soTienPhanBo),
        ghiChu: r.ghiChu || 'Phân bổ riêng'
      }));
    }

    try {
      const res = await apiService.createProposal(
        maNhom, 
        {
          nhomId: Number(maNhom),
          tieuDe: tieuDeDeXuat,
          mucDich: mucDichDeXuat,
          loaiDeXuat: proposalType,
          kieuPhanBo,
          soTienTong: totalAmount,
          coBieuQuyet,
          tyLeToiThieu: tyLeDongYToiThieu,
          anDanhNguoiVote: anDanhNguoiVote,
          chiTietItems: chiTietPayload
        },
        currentUser?.maThanhVienNhom
      );

      const createdDeXuatId = res.data?.maDeXuat;

      triggerBanner(
        coBieuQuyet 
          ? `Đã tạo đề xuất "${tieuDeDeXuat}" và gửi yêu cầu biểu quyết!` 
          : `Đã tạo thông báo đề xuất "${tieuDeDeXuat}" thành công!`
      );
      
      localStore.addNotification(
        coBieuQuyet ? 'Đề xuất mới (Cần biểu quyết)' : 'Thông báo đề xuất mới', 
        `Đề xuất "${tieuDeDeXuat}" vừa được tạo trong nhóm`, 
        'DE_XUAT', 
        Number(maNhom), 
        createdDeXuatId
      );

      setShowProposalModal(false);
      setTieuDeDeXuat('');
      setMucDichDeXuat('');
      setSoTienTongDeXuat('');
      setSelectedMemberIds([]);
      setSelectedVoterIds([]);
      setKieuThanhVienBieuQuyet('TAT_CA');
      setCustomAllocations([{ thanhVienId: '', soTienPhanBo: '', ghiChu: '' }]);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Tạo đề xuất thất bại!');
    }
  };

  const handleRevokeProposal = async (maDeXuat: number) => {
    if (!window.confirm('XÁC NHẬN: Bạn muốn thu hồi đề xuất này?')) return;
    try {
      await apiService.revokeProposal(maDeXuat);
      triggerBanner('Thu hồi đề xuất thành công!');
      fetchData();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Không thể thu hồi!';
      alert(`Không thể thu hồi: ${errorMsg}`);
    }
  };

  const handleVote = async (maDeXuat: number, dongY: boolean) => {
    if (!currentUser?.maThanhVienNhom) {
      alert('Không tìm thấy thông tin thành viên của bạn!');
      return;
    }

    const voteChoice = dongY ? 'DONG_Y' : 'TU_CHOI';
    
    const newVote: VoteItem = {
      maThanhVien: currentUser.maThanhVienNhom,
      thanhVienId: currentUser.maThanhVienNhom,
      tenThanhVien: currentUser.hoTen,
      hoTen: currentUser.hoTen,
      luaChon: voteChoice,
      dongY: dongY,
      ngayTao: new Date().toISOString()
    };
    localStore.saveVote(maDeXuat, newVote);

    try {
      await apiService.voteProposal(maDeXuat, currentUser.maThanhVienNhom, dongY);
    } catch (err: any) {
      console.warn('Đã lưu biểu quyết cục bộ:', err);
    }

    triggerBanner(`Đã cập nhật lựa chọn biểu quyết: ${dongY ? 'ĐỒNG Ý' : 'TỪ CHỐI'}`);

    if (selectedProposalDetail && selectedProposalDetail.maDeXuat === maDeXuat) {
      const updatedVotes = await fetchVotesForProposal(maDeXuat);
      setProposalVotesList(updatedVotes);
    }

    fetchData();
  };

  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.maThanhVienNhom || !maNhom) return;

    const amountNum = parseFloat(soTienNop);
    if (!amountNum || amountNum < 10000) {
      alert('Số tiền nộp qua VNPay tối thiểu là 10.000 VNĐ!');
      return;
    }

    try {
      const res = await apiService.createVNPayPayment({
        nguoiNopId: currentUser.maThanhVienNhom,
        soTien: amountNum,
        noiDung: noiDungNop || 'Nộp tiền quỹ qua VNPay',
        chiTietDeXuatId: chiTietDeXuatNopId
      });

      if (res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể kết nối cổng thanh toán VNPay!');
    }
  };

  const handleConfirmExpense = async (maKhoanChi: number, approve: boolean) => {
    try {
      const trangThai = approve ? 'DA_XAC_NHAN' : 'TU_CHOI';
      await apiService.confirmExpense(maKhoanChi, trangThai, currentUser?.maThanhVienNhom);
      triggerBanner(approve ? 'Đã xác nhận nhận đủ tiền thành công!' : 'Đã từ chối khoản chi!');
      setSelectedTransactionDetail(null);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xử lý khoản chi thất bại!');
    }
  };

  const handleCreateExpenseFull = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.maThanhVienNhom || !maNhom) return;
    if (!soTienChi || !noiDungChi) {
      alert('Vui lòng nhập nội dung và số tiền chi!');
      return;
    }

    const soTienDangGiu = (currentUser as any)?.soTienDangGiu || 0;
    const amountNum = parseFloat(soTienChi);

    if (amountNum > soTienDangGiu) {
      alert(`Số tiền chi (${amountNum.toLocaleString('vi-VN')}) vượt quá số tiền Thủ quỹ đang giữ (${soTienDangGiu.toLocaleString('vi-VN')})! Vui lòng thực hiện Rút quỹ trước.`);
      return;
    }

    let dsPhanBoPayload: Array<{ thanhVienId: number; soTienTru: number }> = [];

    if (loaiNguonTienChi === 'CHIA_DEU_CHON') {
      if (selectedExpenseMemberIds.length === 0) {
        alert('Vui lòng chọn ít nhất 1 thành viên chịu chi phí!');
        return;
      }
      const splitAmount = amountNum / selectedExpenseMemberIds.length;
      dsPhanBoPayload = selectedExpenseMemberIds.map(id => ({
        thanhVienId: id,
        soTienTru: splitAmount
      }));
    } else if (loaiNguonTienChi === 'SO_TIEN_RIENG') {
      const validRows = customExpenseAllocations.filter(r => r.thanhVienId !== '' && parseFloat(r.soTienTru) >= 0);
      if (validRows.length === 0) {
        alert('Vui lòng nhập số tiền trừ cụ thể!');
        return;
      }
      dsPhanBoPayload = validRows.map(r => ({
        thanhVienId: Number(r.thanhVienId),
        soTienTru: parseFloat(r.soTienTru || '0')
      }));
    }

    const targetNguoiNhanId = nguoiNhanChiId ? Number(nguoiNhanChiId) : currentUser.maThanhVienNhom;
    const receiverObj = members.find(m => m.maThanhVienNhom === targetNguoiNhanId);

    try {
      await apiService.createExpense({
        maNhom: Number(maNhom),
        thuQuyThucHienId: currentUser.maThanhVienNhom,
        nguoiNhanChiId: targetNguoiNhanId,
        soTien: amountNum,
        loaiPhanBo: loaiNguonTienChi,
        phuongThuc: phuongThucChi,
        noiDung: noiDungChi,
        chiTietDeXuatId: chiTietDeXuatChiId,
        minhChung: minhChungChi,
        dsPhanBo: dsPhanBoPayload
      });

      triggerBanner(`Đã chi ${amountNum.toLocaleString('vi-VN')} ${loaiTien} từ ví Thủ quỹ cho ${receiverObj?.hoTen || 'người nhận'}!`);
      setShowExpenseModal(false);
      setSoTienChi('');
      setNoiDungChi('');
      setMinhChungChi('');
      setPreviewChiImage(null);
      setNguoiNhanChiId('');
      setSelectedExpenseMemberIds([]);
      setCustomExpenseAllocations([{ thanhVienId: '', soTienTru: '' }]);
      setChiTietDeXuatChiId(undefined);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Tạo khoản chi thất bại!');
    }
  };

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.maThanhVienNhom || !maNhom) return;

    const amountNum = parseFloat(soTienRut);
    if (!amountNum || amountNum <= 0) {
      alert('Vui lòng nhập số tiền rút hợp lệ!');
      return;
    }

    if (amountNum > (group?.soDuQuy || 0)) {
      alert('Số tiền rút vượt quá số dư khả dụng của Quỹ nhóm!');
      return;
    }

    try {
      await apiService.requestWithdrawal({
        maNhom: Number(maNhom),
        thuQuyId: currentUser.maThanhVienNhom,
        soTien: amountNum,
        noiDung: noiDungRut || 'Yêu cầu rút tiền về Ví Thủ quỹ',
        tenNganHang: currentUserProfile?.tenNganHang || '',
        soTaiKhoan: currentUserProfile?.soTaiKhoan || '',
        tenChuTaiKhoan: currentUserProfile?.tenChuTaiKhoan || currentUser.hoTen,
      });

      triggerBanner(`Đã rút ${amountNum.toLocaleString('vi-VN')} ${loaiTien} từ Quỹ nhóm về Ví Thủ quỹ thành công!`);
      setShowWithdrawModal(false);
      setSoTienRut('');
      setNoiDungRut('');
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gửi yêu cầu rút tiền thất bại!');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-medium tracking-wide">Đang tải thông tin nhóm...</p>
      </div>
    );
  }

  if (!group) return null;
  const loaiTien = group.loaiTienTe || 'VND';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-3 sm:px-6">
      {bannerMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-4 py-3 rounded-2xl flex items-center justify-between shadow-lg backdrop-blur-md transition-all">
          <div className="flex items-center gap-3">
            <Info size={18} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{bannerMessage}</span>
          </div>
          <button onClick={() => setBannerMessage(null)} className="text-slate-400 hover:text-white p-1 rounded-lg transition">✕</button>
        </div>
      )}

      {/* Header Toolbar & Action Buttons */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl backdrop-blur-md shadow-xl animate-fade-up">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-2xl transition shadow-sm shrink-0">
              <ArrowLeft size={18} />
            </button>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-display text-2xl font-bold text-white tracking-tight">{group.tenNhom}</h1>
                
                <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border inline-flex items-center gap-1 ${
                  group.cheDoRiengTu === 'RIENG_TU'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {group.cheDoRiengTu === 'RIENG_TU' ? <Lock size={11} /> : <Globe size={11} />}
                  {group.cheDoRiengTu === 'RIENG_TU' ? 'Riêng tư' : 'Công khai'}
                </span>

                {group.trangThai === 'CLOSED' ? (
                  <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 font-bold text-[11px] rounded-full border border-rose-500/20">
                    Đã đóng
                  </span>
                ) : group.maMoi && (
                  <button
                    onClick={() => handleCopyCode(group.maMoi!)}
                    className="px-2.5 py-0.5 bg-slate-950 text-amber-400 font-mono text-[11px] font-semibold rounded-full border border-slate-800 flex items-center gap-1.5 hover:border-amber-500/40 transition">
                    Mã: {group.maMoi} {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
              <p className="text-slate-400 text-xs line-clamp-1">{group.moTa || 'Chưa có mô tả nhóm'}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button 
              onClick={() => {
                setProposalType('THU');
                setKieuPhanBo('THU_DEU_TAT_CA');
                setCoBieuQuyet(true);
                setShowProposalModal(true);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 !text-white font-bold px-4 py-2.5 rounded-xl transition text-xs shadow-md shadow-emerald-600/20 whitespace-nowrap">
              <PlusCircle size={16} className="!text-white" />
              <span className="!text-white">Tạo đề xuất</span>
            </button>

            <button 
              onClick={() => {
                setChiTietDeXuatNopId(undefined);
                setShowDepositModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 !text-white font-bold px-4 py-2.5 rounded-xl transition text-xs shadow-md shadow-blue-600/20 whitespace-nowrap">
              <ArrowDownLeft size={16} className="!text-white" />
              <span className="!text-white">Nộp tiền</span>
            </button>

            <button 
              onClick={() => {
                if (!isThuQuy) alert('Chỉ Thủ quỹ mới được tạo khoản chi!');
                else {
                  setChiTietDeXuatChiId(undefined);
                  setShowExpenseModal(true);
                }
              }}
              className={`flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl transition text-xs whitespace-nowrap ${
                isThuQuy 
                  ? 'bg-rose-600 hover:bg-rose-500 !text-white shadow-md shadow-rose-600/20' 
                  : 'bg-slate-950 text-slate-500 border border-slate-800 cursor-not-allowed'
              }`}>
              <ArrowUpRight size={16} className={isThuQuy ? '!text-white' : ''} />
              <span className={isThuQuy ? '!text-white' : ''}>Chi tiền</span>
            </button>

            {isThuQuy && (
              <button 
                onClick={() => setShowWithdrawModal(true)}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 !text-white font-bold px-4 py-2.5 rounded-xl transition text-xs shadow-md shadow-amber-600/20 whitespace-nowrap">
                <Wallet size={16} className="!text-white" />
                <span className="!text-white">Rút tiền / Quyết toán</span>
              </button>
            )}

            <div className="flex items-center gap-2 border-l border-slate-800/80 pl-2">
              {isQuanTri && (
                <button 
                  onClick={handleOpenSettings}
                  title="Cài đặt nhóm"
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition shrink-0">
                  <Settings size={16} />
                </button>
              )}

              <button 
                onClick={handleLeaveGroup}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 rounded-xl transition text-xs font-semibold whitespace-nowrap">
                <LogOut size={15} />
                Rời nhóm
              </button>

              {isQuanTri && (
                <button 
                  onClick={handleCloseGroup}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-950 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 border border-slate-800 rounded-xl transition text-xs font-semibold whitespace-nowrap">
                  <Power size={15} />
                  Đóng nhóm
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats Grid (4 THẺ THỐNG KÊ RÕ RÀNG VÀ MINH BẠCH) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Thẻ 1: Số dư quỹ hệ thống */}
        <div 
          onClick={() => setShowFundDetailModal(true)}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/35 rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 cursor-pointer group shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider group-hover:text-emerald-400 transition">
              Số dư Quỹ hệ thống
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Wallet size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {(group.soDuQuy || 0).toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-400">{loaiTien}</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-2.5 font-medium flex items-center gap-1">
            <PieChart size={13} /> Số dư khả dụng trên VNPay
          </p>
        </div>

        {/* Thẻ 2: Tổng tiền Thủ quỹ đang giữ (Click mở Modal xem chi tiết từng Thủ quỹ) */}
        <div 
          onClick={() => setShowTreasurerFundsModal(true)}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider group-hover:text-amber-400 transition">
              Tiền Thủ quỹ đang giữ
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">
            {tongTienThuQuyGiu.toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-400">{loaiTien}</span>
          </div>
          <p className="text-[11px] text-amber-400/90 mt-2.5 font-medium flex items-center gap-1">
            <Info size={13} /> Bấm để xem chi tiết từng Thủ quỹ
          </p>
        </div>

        {/* Thẻ 3: Thành viên nhóm */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Thành viên nhóm</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{members.length} <span className="text-xs font-normal text-slate-400">thành viên</span></div>
          <p className="text-[11px] text-slate-400 mt-2.5">Đang tham gia sinh hoạt</p>
        </div>

        {/* Thẻ 4: Đề xuất thu chi */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Đề xuất thu chi</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Vote size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-400 tracking-tight">{proposals.length} <span className="text-xs font-normal text-slate-400">đề xuất</span></div>
          <p className="text-[11px] text-slate-400 mt-2.5">Đang biểu quyết & hoàn tất</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-800/80 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-slate-800 text-white border border-slate-700/80' : 'text-slate-400 hover:text-white'
          }`}>
          <History size={15} /> Nhật ký giao dịch ({filteredHistory.length})
        </button>

        <button
          onClick={() => setActiveTab('proposals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition whitespace-nowrap ${
            activeTab === 'proposals' ? 'bg-slate-800 text-white border border-slate-700/80' : 'text-slate-400 hover:text-white'
          }`}>
          <Vote size={15} /> Đề xuất ({proposals.length})
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition whitespace-nowrap relative ${
            activeTab === 'members' ? 'bg-slate-800 text-white border border-slate-700/80' : 'text-slate-400 hover:text-white'
          }`}>
          <Users size={15} /> Thành viên ({members.length})
          {isQuanTri && pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full animate-pulse ml-1">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: TRANSACTIONS OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl animate-fade-up">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <History size={15} className="text-emerald-400" /> Nhật ký thu chi
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-xl text-xs">
                <Calendar size={13} className="text-emerald-400 shrink-0" />
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => { setStartDateFilter(e.target.value); setHistoryPage(1); }}
                  className="bg-transparent text-slate-300 focus:outline-none"
                />
                <span className="text-slate-600">➔</span>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => { setEndDateFilter(e.target.value); setHistoryPage(1); }}
                  className="bg-transparent text-slate-300 focus:outline-none"
                />
                {(startDateFilter || endDateFilter) && (
                  <button onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }} className="text-slate-500 hover:text-white ml-1">✕</button>
                )}
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Nhập từ khóa..."
                  value={historySearch}
                  onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <select
                value={historyTypeFilter}
                onChange={(e) => { setHistoryTypeFilter(e.target.value); setHistoryPage(1); }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none">
                <option value="ALL">Tất cả</option>
                <option value="THU">Khoản Thu</option>
                <option value="CHI">Khoản Chi</option>
              </select>
            </div>
          </div>

          {paginatedHistory.length === 0 ? (
            <div className="py-12 text-center space-y-2 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
              <History size={24} className="text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Không có lịch sử phát sinh giao dịch phù hợp</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {paginatedHistory.map((item) => {
                const isDeposit = item.type === 'THU';
                const isPending = item.status === 'CHO_XAC_NHAN' || item.status === 'CHO_DUYET';

                const isReceiverByMemberId = currentUser?.maThanhVienNhom && item.receiverId === currentUser.maThanhVienNhom;
                const isReceiverByEmail = currentUserProfile?.email && item.receiverEmail && currentUserProfile.email === item.receiverEmail;
                const isReceiverByName = currentUser?.hoTen && item.receiverName && currentUser.hoTen === item.receiverName;

                const isTargetReceiver = isReceiverByMemberId || isReceiverByEmail || isReceiverByName;
                const canConfirmExpense = !isDeposit && isPending && isTargetReceiver;

                const isFailed = item.status === 'TU_CHOI' || item.status === 'THAT_BAI' || item.status === 'FAILED' || item.status === 'DA_HUY';

                return (
                  <div 
                    key={item.id} 
                    className="p-3.5 bg-slate-950/50 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition">
                    <div 
                      onClick={() => setSelectedTransactionDetail(item)}
                      className="flex items-center gap-3 cursor-pointer group flex-1">
                      <div className={`p-2.5 rounded-2xl border shrink-0 ${
                        item.type === 'THU' 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {item.type === 'THU' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition">{item.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-300 font-medium">{item.personName}</span>
                          <span className="text-slate-600">➔</span>
                          <span className="text-amber-300 font-medium">{item.receiverName}</span>
                          <span className="text-slate-500">• {item.method} • {item.date.toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <div className={`text-xs font-bold ${item.type === 'THU' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.type === 'THU' ? '+' : '-'}{item.amount.toLocaleString('vi-VN')} {loaiTien}
                        </div>
                        <span className={`text-[10px] font-semibold ${
                          item.status === 'DA_XAC_NHAN' ? 'text-emerald-400' : isFailed ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {item.status === 'DA_XAC_NHAN' ? 'Thành công' : isFailed ? 'Thất bại' : 'Chờ xác nhận'}
                        </span>
                      </div>

                      {canConfirmExpense && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleConfirmExpense(item.rawId, true)}
                            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold rounded-xl transition shadow-md shadow-emerald-500/10">
                            Xác nhận đã nhận tiền
                          </button>
                          <button
                            onClick={() => handleConfirmExpense(item.rawId, false)}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-bold rounded-xl transition">
                            Từ chối
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalHistoryPages > 1 && (
            <div className="flex justify-between items-center pt-2 text-xs text-slate-400">
              <span>Trang {historyPage} / {totalHistoryPages}</span>
              <div className="flex gap-1.5">
                <button disabled={historyPage === 1} onClick={() => setHistoryPage(p => p - 1)} className="p-1 bg-slate-950 border border-slate-800 rounded-lg disabled:opacity-30">
                  <ChevronLeft size={14} />
                </button>
                <button disabled={historyPage === totalHistoryPages} onClick={() => setHistoryPage(p => p + 1)} className="p-1 bg-slate-950 border border-slate-800 rounded-lg disabled:opacity-30">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROPOSALS */}
      {activeTab === 'proposals' && (
        <div className="space-y-4 animate-fade-up">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 max-w-xs">
              <button
                onClick={() => setProposalSubTab('ACTIVE')}
                className={`flex-1 py-1 px-3 text-xs font-semibold rounded-lg transition ${
                  proposalSubTab === 'ACTIVE' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}>
                Hiệu lực ({activeProposals.length})
              </button>
              <button
                onClick={() => setProposalSubTab('EXPIRED')}
                className={`flex-1 py-1 px-3 text-xs font-semibold rounded-lg transition ${
                  proposalSubTab === 'EXPIRED' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}>
                Hết hạn / Từ chối ({expiredProposals.length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-xl text-xs">
                <Calendar size={13} className="text-emerald-400 shrink-0" />
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="bg-transparent text-slate-300 focus:outline-none"
                />
                <span className="text-slate-600">➔</span>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="bg-transparent text-slate-300 focus:outline-none"
                />
                {(startDateFilter || endDateFilter) && (
                  <button onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }} className="text-slate-500 hover:text-white ml-1">✕</button>
                )}
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Nhập tên đề xuất..."
                  value={proposalSearch}
                  onChange={(e) => setProposalSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <select
                value={proposalTypeFilter}
                onChange={(e) => setProposalTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none">
                <option value="ALL">Tất cả loại</option>
                <option value="THU">Đề xuất Thu</option>
                <option value="CHI">Đề xuất Chi</option>
              </select>
            </div>
          </div>

          {(proposalSubTab === 'ACTIVE' ? activeProposals : expiredProposals).length === 0 ? (
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-8 text-center space-y-2">
              <Vote size={24} className="text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Không tìm thấy đề xuất nào phù hợp</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {(proposalSubTab === 'ACTIVE' ? activeProposals : expiredProposals).map((prop) => {
                const info = getProposalCalculatedInfo(prop);
                const myVote = info.votesList.find(v => (v.maThanhVien || v.thanhVienId) === currentUser?.maThanhVienNhom);
                const hasVoted = !!myVote;
                const isCreator = prop.nguoiTao?.nguoiDung?.keycloakUserId === currentKeycloakUserId;

                return (
                  <div 
                    key={prop.maDeXuat} 
                    className={`bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all shadow-md ${
                      info.isRejected ? 'opacity-70 grayscale' : ''
                    }`}>
                    
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                        prop.loaiDeXuat === 'THU' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        <Vote size={18} />
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                            prop.loaiDeXuat === 'THU' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {prop.loaiDeXuat === 'THU' ? 'Đề xuất Thu' : 'Đề xuất Chi'}
                          </span>

                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${info.statusBgClass}`}>
                            {info.statusText}
                          </span>

                          {prop.ngayTao && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Clock size={11} /> Hạn: {new Date(info.expiryTime).toLocaleString('vi-VN')}
                            </span>
                          )}
                        </div>

                        <h4 
                          onClick={() => handleOpenProposalDetail(prop)}
                          className="text-sm font-bold text-white hover:text-emerald-400 transition cursor-pointer">
                          {prop.tieuDe || prop.tenDeXuat}
                        </h4>

                        <p className="text-xs text-slate-400 line-clamp-1">{prop.mucDich || prop.moTa || 'Không có mô tả chi tiết'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 border-slate-800/80 pt-3 lg:pt-0 shrink-0">
                      {info.hasVoting ? (
                        <div className="w-36 space-y-1 hidden sm:block">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">Đồng ý:</span>
                            <span className="text-emerald-400 font-semibold">{info.agreePercent}% / Cần {info.minRequiredPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className="bg-emerald-500 h-full transition-all duration-500"
                              style={{ width: `${info.agreePercent}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 italic hidden sm:block">
                          Không cần bỏ phiếu
                        </div>
                      )}

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Tổng tiền</span>
                        <span className="text-sm font-extrabold text-emerald-400">
                          {(prop.soTienTong || prop.soTienDeXuat)?.toLocaleString('vi-VN')} {loaiTien}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenProposalDetail(prop)}
                          title="Xem chi tiết & danh sách vote"
                          className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition">
                          <Eye size={15} />
                        </button>

                        {isCreator && 
                        info.hasVoting && 
                        !info.isApproved && 
                        !info.isRejected && 
                        !['DA_DUYET', 'DA_GIAI_NGAN', 'TU_CHOI', 'HUY', 'DA_HUY', 'APPROVED', 'REJECTED', 'EXPIRED'].includes(String(prop.trangThai || '').toUpperCase()) && (
                          <button
                            onClick={() => handleRevokeProposal(prop.maDeXuat)}
                            title="Thu hồi đề xuất"
                            className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-xl transition">
                            <RotateCcw size={15} />
                          </button>
                        )}

                        {info.hasVoting && !info.isApproved && !info.isRejected && (
                          hasVoted ? (
                            <div className="flex items-center gap-1.5 bg-slate-950 p-1 border border-slate-800 rounded-xl">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                (myVote?.dongY || myVote?.luaChon === 'DONG_Y')
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : 'text-rose-400 bg-rose-500/10'
                              }`}>
                                {(myVote?.dongY || myVote?.luaChon === 'DONG_Y') ? '✓ Đồng ý' : '✕ Từ chối'}
                              </span>
                              <button
                                onClick={() => handleVote(prop.maDeXuat, !(myVote?.dongY || myVote?.luaChon === 'DONG_Y'))}
                                title="Đổi lựa chọn biểu quyết"
                                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] font-bold rounded-lg transition flex items-center gap-1">
                                <RefreshCw size={10} /> Đổi
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleVote(prop.maDeXuat, true)}
                                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition">
                                Đồng ý
                              </button>
                              <button 
                                onClick={() => handleVote(prop.maDeXuat, false)}
                                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition">
                                Từ chối
                              </button>
                            </div>
                          )
                        )}

                        {info.isApproved && (
                          prop.loaiDeXuat === 'THU' ? (
                            <button 
                              onClick={() => handleOpenDepositForProposal(prop)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition shadow-md shadow-blue-600/10 whitespace-nowrap">
                              <ArrowDownLeft size={14} /> Nộp tiền
                            </button>
                          ) : (
                            isThuQuy && (
                              <button 
                                onClick={() => handleOpenExpenseForProposal(prop)}
                                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition shadow-md shadow-rose-500/10 whitespace-nowrap">
                                <ArrowUpRight size={14} /> Tạo khoản chi
                              </button>
                            )
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-4 animate-fade-up">

          {/* QUẢN LÝ YÊU CẦU THAM GIA NHÓM CHỜ DUYỆT */}
          {isQuanTri && pendingRequests.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-4 space-y-3 shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Yêu cầu gia nhập nhóm chờ duyệt ({pendingRequests.length})
                    </h3>
                    <p className="text-[10px] text-slate-400">Chỉ cần 1 Quản trị viên duyệt là thành viên sẽ được nhận vào nhóm</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div key={req.maYeuCau || req.id} className="p-3 bg-slate-950/90 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center font-bold text-xs border border-amber-500/20">
                        {req.nguoiDung?.hoTen?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{req.nguoiDung?.hoTen || 'Thành viên'}</p>
                        <p className="text-[11px] text-slate-400">{req.nguoiDung?.email} {req.lyDoNote && `• ${req.lyDoNote}`}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleProcessJoinRequest(req.maYeuCau || req.id, true)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20">
                        Chấp nhận
                      </button>
                      <button
                        onClick={() => handleProcessJoinRequest(req.maYeuCau || req.id, false)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-rose-500/20 text-rose-400 border border-slate-800 hover:border-rose-500/30 font-bold text-xs rounded-xl transition">
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DANH SÁCH THÀNH VIÊN CHÍNH THỨC */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl space-y-2">
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Danh sách thành viên ({filteredMembers.length}/{members.length})</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Quản lý vai trò & Số dư cá nhân trong quỹ</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Nhập tên thành viên..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <select
                  value={memberRoleFilter}
                  onChange={(e) => setMemberRoleFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none">
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="QUAN_TRI">Quản trị viên</option>
                  <option value="THU_QUY">Thủ quỹ</option>
                  <option value="THANH_VIEN">Thành viên</option>
                </select>
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Không tìm thấy thành viên phù hợp
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {filteredMembers.map((m, idx) => (
                  <div key={m.maThanhVienNhom || idx} className="p-3.5 flex items-center justify-between hover:bg-slate-800/20 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-950 rounded-xl flex items-center justify-center font-bold text-emerald-400 border border-slate-800 shrink-0 text-xs">
                        {m.hoTen?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          {m.hoTen || 'Thành viên ' + (idx + 1)}
                          {m.danhSachVaiTro?.includes('QUAN_TRI') && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded">
                              {getRoleText('QUAN_TRI')}
                            </span>
                          )}
                          {m.danhSachVaiTro?.includes('THU_QUY') && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded">
                              {getRoleText('THU_QUY')}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{m.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-slate-400">
                          Số dư cá nhân: <strong className="text-emerald-400 font-semibold">{(m.soDuCaNhan || 0).toLocaleString('vi-VN')} {loaiTien}</strong>
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedMemberBank(m)}
                        className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-blue-400 border border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1 transition">
                        <CreditCard size={13} /> VietQR
                      </button>

                      {isQuanTri && (
                        <button
                          onClick={() => setSelectedMemberRoleModal(m)}
                          className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 flex items-center gap-1 transition">
                          <Shield size={13} className="text-emerald-400" /> Vai trò
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT ĐỀ XUẤT */}
      {selectedProposalDetail && (() => {
        const prop = selectedProposalDetail;
        const info = getProposalCalculatedInfo(prop);
        const displayVotesList = proposalVotesList.length > 0 ? proposalVotesList : info.votesList;

        const storedAnon = localStorage.getItem(`groupfund_policy_anon_${maNhom}`) === 'true';

        const isAnonymousVoting = Boolean(
          (
            (prop as any).anDanhNguoiVote ?? 
            (prop as any).coAnDanh ?? 
            (prop as any).anDanh ?? 
            (prop as any).an_danh_nguoi_vote ?? 
            anDanhNguoiVote
          ) || storedAnon
        );

        const creatorMemberId = prop.nguoiTao?.maThanhVienNhom || prop.maThanhVienTao;
        const creatorMemberObj = members.find(m => m.maThanhVienNhom === creatorMemberId);
        const creatorName = prop.nguoiTaoName 
          || prop.nguoiTao?.hoTen 
          || creatorMemberObj?.hoTen 
          || creatorMemberObj?.nguoiDung?.hoTen 
          || 'Thành viên nhóm';

        const createdDate = prop.ngayTao ? new Date(prop.ngayTao).toLocaleString('vi-VN') : '---';
        const isThu = prop.loaiDeXuat === 'THU';

        const myVote = displayVotesList.find(v => (v.maThanhVien || v.thanhVienId) === currentUser?.maThanhVienNhom);
        const hasVoted = !!myVote;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Vote size={18} className="text-emerald-400" /> Chi tiết đề xuất & Biểu quyết
                </h3>
                <button onClick={() => setSelectedProposalDetail(null)} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      isThu ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {isThu ? 'Đề xuất Thu' : 'Đề xuất Chi'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${info.statusBgClass}`}>
                      {info.statusText}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white">{prop.tieuDe || prop.tenDeXuat}</h4>
                  <p className="text-slate-400 mt-1 leading-relaxed">{prop.mucDich || prop.moTa || 'Không có mô tả chi tiết'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Người tạo đề xuất</span>
                    <span className="text-xs font-bold text-white mt-0.5 flex items-center gap-1">
                      <User size={13} className="text-emerald-400" /> {creatorName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Thời gian tạo</span>
                    <span className="text-xs font-semibold text-slate-300 mt-0.5 block">{createdDate}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Tổng số tiền</span>
                    <span className="text-sm font-extrabold text-emerald-400 mt-0.5 block">
                      {(prop.soTienTong || prop.soTienDeXuat)?.toLocaleString('vi-VN')} {loaiTien}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Kiểu phân bổ</span>
                    <span className="text-xs font-semibold text-slate-300 mt-0.5 block">{getKieuPhanBoText(prop.kieuPhanBo)}</span>
                  </div>
                </div>

                {prop.danhSachChiTiet && prop.danhSachChiTiet.length > 0 && (
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      Danh sách phân bổ chi tiết:
                    </span>
                    <div className="max-h-28 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-800/40">
                      {prop.danhSachChiTiet.map((item, idx) => {
                        const memberObj = members.find(m => m.maThanhVienNhom === item.thanhVienId);
                        return (
                          <div key={idx} className="pt-1 flex justify-between items-center text-slate-300 text-xs">
                            <span>{memberObj?.hoTen || `Thành viên #${item.thanhVienId}`}</span>
                            <span className="font-semibold text-emerald-400">{item.soTienPhanBo?.toLocaleString('vi-VN')} {loaiTien}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {info.hasVoting && (
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5 text-xs">
                      <Clock size={14} className="text-amber-400" /> Thời hạn biểu quyết:
                    </span>
                    <strong className="text-amber-300 text-xs font-mono">
                      {new Date(info.expiryTime).toLocaleString('vi-VN')}
                    </strong>
                  </div>
                )}

                {info.hasVoting ? (
                  <>
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">Tiến trình biểu quyết:</span>
                        <span className="text-emerald-400 font-bold">
                          {info.agreePercent}% / Cần tối thiểu {info.minRequiredPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${info.agreePercent}%` }}
                        />
                      </div>
                    </div>

                    {!info.isApproved && !info.isRejected && (
                      <div className="p-3.5 bg-slate-950 rounded-2xl border border-amber-500/20 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white">Lựa chọn của bạn:</span>
                          {hasVoted && (
                            <span className="text-[11px] text-emerald-400 font-semibold">
                              (Đã bỏ phiếu: {myVote.dongY || myVote.luaChon === 'DONG_Y' ? 'Đồng ý' : 'Từ chối'})
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVote(prop.maDeXuat, true)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                              (myVote?.dongY || myVote?.luaChon === 'DONG_Y')
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                : 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-slate-800'
                            }`}>
                            <CheckCircle2 size={14} /> Đồng ý
                          </button>
                          <button
                            onClick={() => handleVote(prop.maDeXuat, false)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                              myVote && !(myVote.dongY || myVote.luaChon === 'DONG_Y')
                                ? 'bg-rose-500 text-white border-rose-400'
                                : 'bg-slate-900 hover:bg-slate-800 text-rose-400 border-slate-800'
                            }`}>
                            <XCircle size={14} /> Từ chối
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          Thành viên đã bỏ phiếu ({displayVotesList.length} / {info.totalGroupMembers} lượt)
                          {isAnonymousVoting && (
                            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] rounded flex items-center gap-1 font-semibold">
                              <EyeOff size={10} /> Đang bật ẩn danh
                            </span>
                          )}
                        </span>
                        {loadingVotes && <span className="text-slate-400 text-[10px]">Đang tải...</span>}
                      </div>

                      {displayVotesList.length === 0 ? (
                        <p className="text-slate-500 italic text-[11px] p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                          Chưa có lượt bỏ phiếu nào được ghi nhận.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {displayVotesList.map((v, idx) => {
                            const isAgree = v.dongY || v.luaChon === 'DONG_Y';
                            const voterId = v.maThanhVien || v.thanhVienId;
                            const isMe = currentUser?.maThanhVienNhom && voterId === currentUser.maThanhVienNhom;
                            const realName = v.tenThanhVien || v.hoTen || `Thành viên #${voterId}`;

                            let displayMemberName = realName;
                            if (isAnonymousVoting) {
                              displayMemberName = isMe ? 'Bạn (Ẩn danh)' : `Thành viên ẩn danh #${idx + 1}`;
                            }

                            const rawDate = v.ngayTao || v.ngayBieuQuyet;
                            const voteTime = rawDate ? new Date(rawDate).toLocaleString('vi-VN') : '';

                            return (
                              <div key={idx} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
                                <div>
                                  <span className={`font-semibold block ${isMe && isAnonymousVoting ? 'text-amber-400' : 'text-white'}`}>
                                    {displayMemberName}
                                  </span>
                                  {voteTime && <span className="text-[10px] text-slate-500">{voteTime}</span>}
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                  isAgree ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {isAgree ? '✓ ĐỒNG Ý' : '✕ TỪ CHỐI'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-slate-950 rounded-2xl border border-blue-500/20 text-center space-y-1">
                    <span className="text-xs font-bold text-blue-400 block">Đề xuất dạng thông báo</span>
                    <p className="text-[11px] text-slate-400">Đề xuất này không yêu cầu các thành viên vào bỏ phiếu biểu quyết.</p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-between items-center">
                {info.isApproved && (
                  prop.loaiDeXuat === 'THU' ? (
                    <button 
                      onClick={() => { setSelectedProposalDetail(null); handleOpenDepositForProposal(prop); }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition">
                      <ArrowDownLeft size={15} /> Nộp tiền ngay
                    </button>
                  ) : (
                    isThuQuy && (
                      <button 
                        onClick={() => { setSelectedProposalDetail(null); handleOpenExpenseForProposal(prop); }}
                        className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition">
                        <ArrowUpRight size={15} /> Tạo khoản chi ngay
                      </button>
                    )
                  )
                )}
                <button onClick={() => setSelectedProposalDetail(null)} className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl ml-auto">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL CÀI ĐẶT NHÓM */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Settings size={16} className="text-emerald-400" /> Cài đặt nhóm & Chế độ biểu quyết
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800/80">
              <button
                type="button"
                onClick={() => setSettingsTab('INFO')}
                className={`py-1.5 rounded-xl font-semibold text-xs transition ${
                  settingsTab === 'INFO' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}>
                Thông tin chung
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('POLICY')}
                className={`py-1.5 rounded-xl font-semibold text-xs transition ${
                  settingsTab === 'POLICY' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}>
                Cấu hình Biểu quyết
              </button>
            </div>

            {settingsTab === 'INFO' && (
              <form onSubmit={handleSaveGroupInfo} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tên nhóm (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên nhóm..."
                    value={editTenNhom}
                    onChange={(e) => setEditTenNhom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mục tiêu quỹ ({loaiTien})</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Nhập mục tiêu số tiền..."
                    value={editMucTieuQuy}
                    onChange={(e) => setEditMucTieuQuy(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Chế độ riêng tư</label>
                  <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800/80 rounded-xl">
                    <div className="flex items-center gap-2">
                      {editCheDoRiengTu === 'RIENG_TU' ? <Lock size={15} className="text-amber-400" /> : <Globe size={15} className="text-emerald-400" />}
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          {editCheDoRiengTu === 'RIENG_TU' ? 'Riêng tư' : 'Công khai'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {editCheDoRiengTu === 'RIENG_TU' ? 'Cần mã mời & chờ duyệt để tham gia' : 'Bất kỳ ai cũng có thể tham gia'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditCheDoRiengTu(prev => prev === 'RIENG_TU' ? 'CONG_KHAI' : 'RIENG_TU')}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        editCheDoRiengTu === 'RIENG_TU' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    >
                      <div className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        editCheDoRiengTu === 'RIENG_TU' ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mô tả nhóm</label>
                  <textarea
                    rows={2}
                    placeholder="Nhập mô tả nhóm..."
                    value={editMoTa}
                    onChange={(e) => setEditMoTa(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowSettingsModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl font-semibold">Hủy</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md">Lưu thay đổi</button>
                </div>
              </form>
            )}

            {settingsTab === 'POLICY' && (
              <form onSubmit={handleSaveVotingPolicy} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Tỷ lệ đồng ý tối thiểu để thông qua: <strong className="text-emerald-400">{tyLeDongYToiThieu}%</strong>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={tyLeDongYToiThieu}
                    onChange={(e) => setTyLeDongYToiThieu(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1">
                    <Hourglass size={14} className="text-amber-400" /> Thời gian hiệu lực đề xuất (giờ)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    placeholder="Nhập số giờ hiệu lực..."
                    value={thoiGianHieuLucHours}
                    onChange={(e) => setThoiGianHieuLucHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white block">Ẩn danh tính người bỏ phiếu</span>
                    <span className="text-[10px] text-slate-400 block">Ẩn tên người dùng trong danh sách bỏ phiếu biểu quyết</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={anDanhNguoiVote} 
                      onChange={(e) => setAnDanhNguoiVote(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowSettingsModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl font-semibold">Hủy</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md">Lưu cấu hình</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL ĐỐI SOÁT QUY CHUNG */}
      {showFundDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="text-emerald-400" size={18} />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Đối soát thu chi quỹ nhóm</h3>
              </div>
              <button onClick={() => setShowFundDetailModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/20 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 block">Số dư quỹ khả dụng (Hệ thống)</span>
                <div className="text-2xl font-bold text-white tracking-tight">
                  {soDuQuyHienTai.toLocaleString('vi-VN')} {loaiTien}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-0.5">
                  <span className="text-slate-400 text-[11px] block">Tổng thu tích lũy</span>
                  <strong className="text-emerald-400 text-sm font-bold">+{tongTienVao.toLocaleString('vi-VN')} {loaiTien}</strong>
                </div>
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-0.5">
                  <span className="text-slate-400 text-[11px] block">Tổng chi tích lũy</span>
                  <strong className="text-rose-400 text-sm font-bold">-{tongTienRa.toLocaleString('vi-VN')} {loaiTien}</strong>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button onClick={() => setShowFundDetailModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT DANH SÁCH THỦ QUỶ ĐANG GIỮ TIỀN (MINH BẠCH TẤT CẢ THÀNH VIÊN) */}
      {showTreasurerFundsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={16} className="text-amber-400" /> Minh bạch Tiền Thủ quỹ đang giữ
              </h3>
              <button onClick={() => setShowTreasurerFundsModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300 space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <Info size={14} /> Giải thích nguồn tiền:
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Đây là tổng số tiền mà các <strong>Thủ quỹ</strong> đã bấm <em>Rút quỹ</em> từ Ví nhóm về ví/tài khoản cá nhân để sẵn sàng trực tiếp chi trả cho các hoạt động của nhóm.
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-800/60">
              {members.filter(m => ((m as any).soTienDangGiu || 0) > 0 || m.danhSachVaiTro?.includes('THU_QUY')).length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-6">Chưa có Thủ quỹ nào rút tiền về giữ.</p>
              ) : (
                members
                  .filter(m => ((m as any).soTienDangGiu || 0) > 0 || m.danhSachVaiTro?.includes('THU_QUY'))
                  .map((m) => {
                    const amount = (m as any).soTienDangGiu || 0;
                    return (
                      <div key={m.maThanhVienNhom} className="pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-amber-500/10 text-amber-400 font-bold rounded-xl flex items-center justify-center text-xs border border-amber-500/20">
                            {m.hoTen?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white flex items-center gap-1.5">
                              {m.hoTen}
                              {m.danhSachVaiTro?.includes('THU_QUY') && (
                                <span className="px-1.5 py-0.2 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-semibold">Thủ quỹ</span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400">{m.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-amber-400 block">
                            {amount.toLocaleString('vi-VN')} {loaiTien}
                          </span>
                          <span className="text-[9px] text-slate-500">Đang nắm giữ</span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="pt-2 text-right">
              <button 
                onClick={() => setShowTreasurerFundsModal(false)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-700 transition">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VIETQR DETAIL CHO TỪNG THÀNH VIÊN */}
      {selectedMemberBank && (() => {
        const { qrUrl, stk, bank, chuTk } = getMemberBankDetails(selectedMemberBank);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <CreditCard size={15} className="text-blue-400" /> Tài khoản nhận tiền
                </h3>
                <button onClick={() => setSelectedMemberBank(null)} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
                  <X size={18} />
                </button>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">Chủ tài khoản:</span><strong className="text-white">{chuTk || selectedMemberBank.hoTen}</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">Ngân hàng:</span><strong className="text-emerald-400">{bank || 'Chưa cập nhật'}</strong></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-amber-400 font-mono">{stk || 'Chưa cập nhật'}</strong>
                    {stk && (
                      <button 
                        onClick={() => handleCopyText(stk)} 
                        title="Sao chép số tài khoản"
                        className="text-slate-400 hover:text-amber-400 transition">
                        {copiedStk ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {qrUrl ? (
                <div className="rounded-2xl overflow-hidden border border-slate-800/80 p-2 bg-slate-950 flex flex-col items-center group relative">
                  <img 
                    src={qrUrl} 
                    alt="Mã VietQR" 
                    onClick={() => setEnlargedQrUrl(qrUrl)}
                    className="max-h-52 object-contain rounded-xl cursor-pointer transition transform hover:scale-105" 
                  />
                  <button 
                    onClick={() => setEnlargedQrUrl(qrUrl)}
                    className="mt-2 text-xs text-blue-400 font-bold hover:underline flex items-center gap-1.5">
                    <ZoomIn size={14} /> Bấm để phóng to mã VietQR
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
                  <QrCode size={28} className="mx-auto text-slate-600" />
                  <p>Thành viên chưa tải lên ảnh mã VietQR</p>
                </div>
              )}

              <button onClick={() => setSelectedMemberBank(null)} className="w-full py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl">
                Đóng
              </button>
            </div>
          </div>
        );
      })()}

      {/* MODAL CHI TIẾT GIAO DỊCH LỊCH SỬ */}
      {selectedTransactionDetail && (() => {
        const item = selectedTransactionDetail;
        const isDeposit = item.type === 'THU';
        const isPending = item.status === 'CHO_XAC_NHAN' || item.status === 'CHO_DUYET';

        const isReceiverByMemberId = currentUser?.maThanhVienNhom && item.receiverId === currentUser.maThanhVienNhom;
        const isReceiverByEmail = currentUserProfile?.email && item.receiverEmail && currentUserProfile.email === item.receiverEmail;
        const isReceiverByName = currentUser?.hoTen && item.receiverName && currentUser.hoTen === item.receiverName;

        const isTargetReceiver = isReceiverByMemberId || isReceiverByEmail || isReceiverByName;
        const canConfirmExpense = !isDeposit && isPending && isTargetReceiver;

        const isFailed = item.status === 'TU_CHOI' || item.status === 'THAT_BAI' || item.status === 'FAILED' || item.status === 'DA_HUY';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Receipt size={16} className="text-emerald-400" /> Chi tiết giao dịch
                </h3>
                <button onClick={() => setSelectedTransactionDetail(null)} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Loại giao dịch</span>
                    <span className={`text-xs font-bold ${isDeposit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isDeposit ? 'Khoản Thu (VNPay)' : 'Khoản Chi'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Trạng thái</span>
                    <span className={`text-xs font-bold ${item.status === 'DA_XAC_NHAN' ? 'text-emerald-400' : isFailed ? 'text-rose-400' : 'text-amber-400'}`}>
                      {item.status === 'DA_XAC_NHAN' ? 'Thành công' : isFailed ? 'Thất bại' : 'Chờ xác nhận'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Nội dung</span>
                  <p className="text-sm font-semibold text-white mt-0.5">{item.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Người thực hiện</span>
                    <p className="text-slate-200 font-semibold mt-0.5">{item.personName}</p>
                    {item.personEmail && <p className="text-[10px] text-slate-400">{item.personEmail}</p>}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Đối tượng nhận / Quỹ</span>
                    <p className="text-slate-200 font-semibold mt-0.5">{item.receiverName}</p>
                    {item.receiverEmail && <p className="text-[10px] text-slate-400">{item.receiverEmail}</p>}
                  </div>
                </div>

                {item.loaiPhanBo && (
                  <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400">Cơ chế phân bổ:</span>
                    <span className="font-semibold text-emerald-400">
                      {getKieuPhanBoText(item.loaiPhanBo)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span>Phương thức: <strong className="text-slate-200">{item.method}</strong></span>
                  <span>Ngày: <strong className="text-slate-200">{item.date.toLocaleDateString('vi-VN')}</strong></span>
                </div>

                {item.minhChung && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Minh chứng / Hóa đơn:</span>
                    <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2 text-center">
                      <img 
                        src={item.minhChung} 
                        alt="Minh chứng" 
                        className="max-h-48 object-contain mx-auto rounded-xl shadow-md cursor-pointer hover:scale-105 transition"
                        onClick={() => setEnlargedQrUrl(item.minhChung!)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {canConfirmExpense && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
                  <p className="text-[11px] text-amber-300 text-center font-medium">Bạn được chọn là người thụ hưởng khoản chi này. Hãy xác nhận khi đã nhận đủ tiền!</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConfirmExpense(item.rawId, true)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-md">
                      ✓ Xác nhận đã nhận tiền
                    </button>
                    <button
                      onClick={() => handleConfirmExpense(item.rawId, false)}
                      className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs rounded-xl transition">
                      ✕ Từ chối
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 text-right">
                <button onClick={() => setSelectedTransactionDetail(null)} className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL TẠO ĐỀ XUẤT */}
      {showProposalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <PlusCircle size={16} className="text-emerald-400" /> Tạo đề xuất mới
              </h3>
              <button onClick={() => setShowProposalModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800/80">
              <button
                type="button"
                onClick={() => { setProposalType('THU'); setKieuPhanBo('THU_DEU_TAT_CA'); }}
                className={`py-1.5 rounded-xl font-bold text-xs transition ${proposalType === 'THU' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>
                Đề xuất THU TIỀN
              </button>
              <button
                type="button"
                onClick={() => { setProposalType('CHI'); setKieuPhanBo('CHI_NHIEU_NGUOI_CHUNG'); }}
                className={`py-1.5 rounded-xl font-bold text-xs transition ${proposalType === 'CHI' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}>
                Đề xuất CHI TIỀN
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-3.5">
              <div className="space-y-2 bg-slate-950 border border-slate-800/80 rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Yêu cầu mọi người vào bỏ phiếu biểu quyết</span>
                    <span className="text-[10px] text-slate-400">Nếu tắt, đề xuất dạng thông báo (tự động duyệt)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={coBieuQuyet}
                    onChange={(e) => setCoBieuQuyet(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>

                {coBieuQuyet && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <label className="block text-xs font-semibold text-amber-400">Thành viên có quyền bỏ phiếu:</label>
                    <div className="flex items-center gap-4 text-xs">
                      <label className="flex items-center gap-1 text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="voterType"
                          checked={kieuThanhVienBieuQuyet === 'TAT_CA'}
                          onChange={() => setKieuThanhVienBieuQuyet('TAT_CA')}
                          className="accent-emerald-500"
                        />
                        <span>Tất cả thành viên</span>
                      </label>

                      <label className="flex items-center gap-1 text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="voterType"
                          checked={kieuThanhVienBieuQuyet === 'CHI_DINH'}
                          onChange={() => setKieuThanhVienBieuQuyet('CHI_DINH')}
                          className="accent-emerald-500"
                        />
                        <span>Chỉ định cụ thể</span>
                      </label>
                    </div>

                    {kieuThanhVienBieuQuyet === 'CHI_DINH' && (
                      <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 space-y-1 mt-1">
                        <span className="text-[10px] text-slate-400 block font-semibold">Tích chọn thành viên được biểu quyết:</span>
                        <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                          {members.map(m => (
                            <label key={m.maThanhVienNhom} className="flex items-center gap-2 text-xs text-slate-300 hover:bg-slate-950 p-1 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedVoterIds.includes(m.maThanhVienNhom)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedVoterIds([...selectedVoterIds, m.maThanhVienNhom]);
                                  else setSelectedVoterIds(selectedVoterIds.filter(id => id !== m.maThanhVienNhom));
                                }}
                                className="w-3.5 h-3.5 accent-emerald-500 rounded"
                              />
                              <span>{m.hoTen} ({m.email})</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Kiểu phân bổ (*)</label>
                <select
                  value={kieuPhanBo}
                  onChange={(e) => setKieuPhanBo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                  {proposalType === 'THU' ? (
                    <>
                      <option value="THU_DEU_TAT_CA">{getKieuPhanBoText('THU_DEU_TAT_CA')}</option>
                      <option value="THU_DEU_NHO_LE">{getKieuPhanBoText('THU_DEU_NHO_LE')}</option>
                      <option value="NHAP_RIENG_TUNG_NGUOI">{getKieuPhanBoText('NHAP_RIENG_TUNG_NGUOI')}</option>
                    </>
                  ) : (
                    <>
                      <option value="CHI_NHIEU_NGUOI_CHUNG">{getKieuPhanBoText('CHI_NHIEU_NGUOI_CHUNG')}</option>
                      <option value="CHI_NHIEU_NGUOI_RIENG">{getKieuPhanBoText('CHI_NHIEU_NGUOI_RIENG')}</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tiêu đề đề xuất (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tiêu đề đề xuất..."
                  value={tieuDeDeXuat}
                  onChange={(e) => setTieuDeDeXuat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Mô tả chi tiết</label>
                <textarea
                  rows={2}
                  placeholder="Nhập mô tả nội dung..."
                  value={mucDichDeXuat}
                  onChange={(e) => setMucDichDeXuat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-400">
                    Tổng số tiền ({loaiTien}) (*)
                  </label>
                  {(kieuPhanBo === 'NHAP_RIENG_TUNG_NGUOI' || kieuPhanBo === 'CHI_NHIEU_NGUOI_RIENG') && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Calculator size={12} /> Tự động tính từ danh sách bên dưới
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  required
                  min="1000"
                  placeholder="Nhập số tiền..."
                  value={soTienTongDeXuat}
                  readOnly={kieuPhanBo === 'NHAP_RIENG_TUNG_NGUOI' || kieuPhanBo === 'CHI_NHIEU_NGUOI_RIENG'}
                  onChange={(e) => setSoTienTongDeXuat(e.target.value)}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 ${
                    (kieuPhanBo === 'NHAP_RIENG_TUNG_NGUOI' || kieuPhanBo === 'CHI_NHIEU_NGUOI_RIENG') ? 'bg-slate-900/60 font-bold text-emerald-400 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {kieuPhanBo === 'THU_DEU_NHO_LE' && (
                <div className="space-y-2 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-amber-400 uppercase">Chọn thành viên tham gia đóng góp:</label>
                    {selectedMemberIds.length > 0 && soTienTongDeXuat && (
                      <span className="text-[11px] text-emerald-400 font-bold">
                        ~ {(parseFloat(soTienTongDeXuat) / selectedMemberIds.length).toLocaleString('vi-VN')} {loaiTien}/người
                      </span>
                    )}
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {members.map(m => {
                      const isChecked = selectedMemberIds.includes(m.maThanhVienNhom);
                      return (
                        <label key={m.maThanhVienNhom} className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800 text-xs cursor-pointer hover:bg-slate-800 transition">
                          <span className="font-medium text-white">{m.hoTen} ({m.email})</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedMemberIds([...selectedMemberIds, m.maThanhVienNhom]);
                              else setSelectedMemberIds(selectedMemberIds.filter(id => id !== m.maThanhVienNhom));
                            }}
                            className="accent-emerald-500 w-4 h-4 rounded"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {(kieuPhanBo === 'NHAP_RIENG_TUNG_NGUOI' || kieuPhanBo === 'CHI_NHIEU_NGUOI_RIENG') && (
                <div className="space-y-2.5 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-amber-400 uppercase">Chi tiết số tiền từng thành viên:</label>
                    <button
                      type="button"
                      onClick={() => setCustomAllocations([...customAllocations, { thanhVienId: '', soTienPhanBo: '', ghiChu: '' }])}
                      className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-500/20">
                      <Plus size={12} /> Thêm người
                    </button>
                  </div>

                  {customAllocations.map((row, index) => (
                    <div key={index} className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <select
                        value={row.thanhVienId}
                        onChange={(e) => {
                          const updated = [...customAllocations];
                          updated[index].thanhVienId = Number(e.target.value);
                          setCustomAllocations(updated);
                        }}
                        className="bg-slate-950 border border-slate-800 text-xs rounded-lg p-1.5 text-white flex-1 focus:outline-none">
                        <option value="">-- Chọn TV --</option>
                        {members.map(m => (
                          <option key={m.maThanhVienNhom} value={m.maThanhVienNhom}>{m.hoTen}</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        placeholder="Số tiền..."
                        value={row.soTienPhanBo}
                        onChange={(e) => {
                          const updated = [...customAllocations];
                          updated[index].soTienPhanBo = e.target.value;
                          setCustomAllocations(updated);
                        }}
                        className="bg-slate-950 border border-slate-800 text-xs rounded-lg p-1.5 text-white w-28 focus:outline-none"
                      />

                      {customAllocations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setCustomAllocations(customAllocations.filter((_, i) => i !== index))}
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowProposalModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl font-semibold">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md">Tạo đề xuất</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TẠO KHOẢN NỘP (VNPAY) */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ArrowDownLeft size={16} className="text-blue-400" /> Nộp tiền vào Quỹ nhóm (VNPay)
              </h3>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <CreditCard size={14} className="text-blue-400" /> Thanh toán tự động 24/7
              </p>
              <p className="text-[11px] text-slate-400">
                Khoản nộp sẽ được chuyển trực tiếp vào Ví tạm giữ trung tâm của Quỹ nhóm và tự động cập nhật số dư ngay sau khi thanh toán thành công.
              </p>
            </div>

            <form onSubmit={handleCreateDeposit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Số tiền nộp ({loaiTien}) (*) <span className="text-amber-400 text-[10px]">(Tối thiểu 10.000 {loaiTien})</span>
                </label>
                <input
                  type="number"
                  required
                  min="10000"
                  placeholder="Nhập số tiền (tối thiểu 10.000)..."
                  value={soTienNop}
                  onChange={(e) => setSoTienNop(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nội dung nộp tiền (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập nội dung đóng quỹ..."
                  value={noiDungNop}
                  onChange={(e) => setNoiDungNop(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowDepositModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl font-semibold">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5">
                  Thanh toán VNPay ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TẠO KHOẢN CHI (RÀNG BUỘC MẶC ĐỊNH TRỪ TIỀN THỦ QUỶ ĐANG GIỮ) */}
      {showExpenseModal && (() => {
        const soTienDangGiu = (currentUser as any)?.soTienDangGiu || 0;
        const soTienChiNum = parseFloat(soTienChi || '0');
        const isVuotHanMuc = soTienChiNum > soTienDangGiu;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ArrowUpRight size={16} className="text-rose-400" /> Tạo khoản chi tiền cho thành viên
                </h3>
                <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
                  <X size={18} />
                </button>
              </div>

              <div className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                isVuotHanMuc ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}>
                <div className="flex justify-between items-center font-bold">
                  <span className="flex items-center gap-1.5">
                    <Wallet size={15} /> Nguồn tiền chi mặc định:
                  </span>
                  <span className="text-sm underline font-mono">
                    Ví Thủ quỹ ({soTienDangGiu.toLocaleString('vi-VN')} {loaiTien})
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 pt-1">
                  Khoản chi này sẽ **trực tiếp trừ vào Số tiền Thủ quỹ đang giữ**, hoàn toàn KHÔNG trừ vào Số dư quỹ nhóm (`soDuQuy`) lần thứ hai.
                </p>
                {isVuotHanMuc && (
                  <p className="text-[11px] font-bold text-rose-400 pt-1 border-t border-rose-500/20">
                    ⚠️ Số tiền chi vượt quá số tiền bạn đang giữ! Vui lòng bấm "Rút tiền / Quyết toán" trước.
                  </p>
                )}
              </div>

              <form onSubmit={handleCreateExpenseFull} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Cá nhân / Đơn vị thụ hưởng (*)</label>
                  <select
                    required
                    value={nguoiNhanChiId}
                    onChange={(e) => setNguoiNhanChiId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                    <option value="">-- Chọn người thụ hưởng --</option>
                    {members.map(m => (
                      <option key={m.maThanhVienNhom} value={m.maThanhVienNhom}>{m.hoTen} ({m.email})</option>
                    ))}
                  </select>
                </div>

                {/* VIETQR VÀ THÔNG TIN NGÂN HÀNG CỦA NGƯỜI NHẬN */}
                {nguoiNhanChiId && (() => {
                  const receiverMember = members.find(m => m.maThanhVienNhom === Number(nguoiNhanChiId));
                  const { qrUrl, stk, bank, chuTk } = getMemberBankDetails(receiverMember || null);

                  return (
                    <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                          <CreditCard size={13} /> Thông tin VietQR nhận tiền người thụ hưởng:
                        </span>
                        {loadingReceiverBank && (
                          <span className="text-[10px] text-amber-400 flex items-center gap-1 animate-pulse">
                            <Loader2 size={12} className="animate-spin" /> Đang tải ngân hàng...
                          </span>
                        )}
                      </div>

                      <div className="text-xs space-y-1.5 text-slate-300">
                        <div className="flex justify-between"><span className="text-slate-400">Chủ tài khoản:</span> <strong className="text-white">{chuTk || receiverMember?.hoTen}</strong></div>
                        <div className="flex justify-between"><span className="text-slate-400">Ngân hàng:</span> <strong className="text-emerald-400">{bank || 'Chưa cập nhật'}</strong></div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Số tài khoản:</span>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-amber-400 font-mono">{stk || 'Chưa cập nhật'}</strong>
                            {stk && (
                              <button 
                                type="button"
                                onClick={() => handleCopyText(stk)} 
                                title="Sao chép số tài khoản"
                                className="text-slate-400 hover:text-amber-400 transition">
                                {copiedStk ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {qrUrl ? (
                        <div className="pt-2 text-center bg-slate-900 p-2 rounded-xl border border-slate-800/80">
                          <img 
                            src={qrUrl} 
                            alt="VietQR Người nhận" 
                            className="max-h-44 mx-auto object-contain rounded-xl border border-slate-800 cursor-pointer hover:scale-105 transition"
                            onClick={() => setEnlargedQrUrl(qrUrl)}
                          />
                          <span className="text-[10px] text-blue-400 font-semibold mt-1.5 block cursor-pointer" onClick={() => setEnlargedQrUrl(qrUrl)}>
                            🔍 Bấm để phóng to mã QR chuyển khoản
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 text-center space-y-1">
                          <AlertCircle size={18} className="text-amber-400 mx-auto" />
                          <p className="text-[11px] text-slate-400">
                            {loadingReceiverBank ? 'Đang truy xuất thông tin ngân hàng...' : 'Thành viên này chưa tải lên ảnh mã VietQR trong Trang cá nhân.'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nội dung chi (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập nội dung chi..."
                    value={noiDungChi}
                    onChange={(e) => setNoiDungChi(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-400">
                      Tổng số tiền chi ({loaiTien}) (*)
                    </label>
                    {loaiNguonTienChi === 'SO_TIEN_RIENG' && (
                      <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                        <Calculator size={12} /> Tự động tính từ danh sách bên dưới
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    required
                    min="1000"
                    placeholder="Nhập số tiền..."
                    value={soTienChi}
                    readOnly={loaiNguonTienChi === 'SO_TIEN_RIENG'}
                    onChange={(e) => setSoTienChi(e.target.value)}
                    className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50 ${
                      isVuotHanMuc ? 'border-rose-500 text-rose-400' : ''
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400">
                    Loại phân bổ chi phí cho thành viên (*)
                  </label>
                  <select
                    value={loaiNguonTienChi}
                    onChange={(e) => setLoaiNguonTienChi(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                    <option value="QUY_CHUNG">Trừ số dư cá nhân tất cả thành viên (Chia đều)</option>
                    <option value="CHIA_DEU_CHON">Trừ số dư cá nhân nhóm thành viên chỉ định</option>
                    <option value="SO_TIEN_RIENG">Trừ số dư cá nhân tùy chỉnh từng người</option>
                  </select>
                  <p className="text-[10px] text-emerald-400 italic">
                    💡 <strong>Lưu ý:</strong> Lựa chọn phân bổ chỉ phục vụ tính toán/ghi nợ vào <strong>Số dư cá nhân (`soDuCaNhan`)</strong> của các thành viên chịu chi phí, không làm trừ thêm tiền quỹ nhóm.
                  </p>
                </div>

                {loaiNguonTienChi === 'CHIA_DEU_CHON' && (
                  <div className="space-y-2 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-rose-400 uppercase">Chọn thành viên chịu chi phí này:</label>
                      {selectedExpenseMemberIds.length > 0 && soTienChi && (
                        <span className="text-[11px] text-rose-400 font-bold">
                          ~ {(parseFloat(soTienChi) / selectedExpenseMemberIds.length).toLocaleString('vi-VN')} {loaiTien}/người
                        </span>
                      )}
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {members.map(m => {
                        const isChecked = selectedExpenseMemberIds.includes(m.maThanhVienNhom);
                        return (
                          <label key={m.maThanhVienNhom} className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800 text-xs cursor-pointer hover:bg-slate-800 transition">
                            <span className="font-medium text-white">{m.hoTen} ({m.email})</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedExpenseMemberIds([...selectedExpenseMemberIds, m.maThanhVienNhom]);
                                else setSelectedExpenseMemberIds(selectedExpenseMemberIds.filter(id => id !== m.maThanhVienNhom));
                              }}
                              className="accent-rose-500 w-4 h-4 rounded"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {loaiNguonTienChi === 'SO_TIEN_RIENG' && (
                  <div className="space-y-2.5 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-rose-400 uppercase">Phân bổ số tiền trừ từng người:</label>
                      <button
                        type="button"
                        onClick={() => setCustomExpenseAllocations([...customExpenseAllocations, { thanhVienId: '', soTienTru: '' }])}
                        className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-rose-500/20">
                        <Plus size={12} /> Thêm dòng
                      </button>
                    </div>

                    {customExpenseAllocations.map((row, index) => (
                      <div key={index} className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <select
                          value={row.thanhVienId}
                          onChange={(e) => {
                            const updated = [...customExpenseAllocations];
                            updated[index].thanhVienId = Number(e.target.value);
                            setCustomExpenseAllocations(updated);
                          }}
                          className="bg-slate-950 border border-slate-800 text-xs rounded-lg p-1.5 text-white flex-1 focus:outline-none">
                          <option value="">-- Chọn TV --</option>
                          {members.map(m => (
                            <option key={m.maThanhVienNhom} value={m.maThanhVienNhom}>{m.hoTen}</option>
                          ))}
                        </select>

                        <input
                          type="number"
                          placeholder="Số tiền trừ..."
                          value={row.soTienTru}
                          onChange={(e) => {
                            const updated = [...customExpenseAllocations];
                            updated[index].soTienTru = e.target.value;
                            setCustomExpenseAllocations(updated);
                          }}
                          className="bg-slate-950 border border-slate-800 text-xs rounded-lg p-1.5 text-white w-28 focus:outline-none"
                        />

                        {customExpenseAllocations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setCustomExpenseAllocations(customExpenseAllocations.filter((_, i) => i !== index))}
                            className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Phương thức chi</label>
                  <select
                    value={phuongThucChi}
                    onChange={(e) => setPhuongThucChi(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                    <option value="CHUYEN_KHOAN">{getPaymentMethodText('CHUYEN_KHOAN')}</option>
                    <option value="TIEN_MAT">{getPaymentMethodText('TIEN_MAT')}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                    <ImageIcon size={13} className="text-rose-400" /> Ảnh hóa đơn / Minh chứng chi
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 hover:border-rose-500/50 transition flex items-center gap-1.5 shrink-0">
                      <Upload size={13} className="text-rose-400" />
                      <span>Tải ảnh từ máy</span>
                      <input type="file" accept="image/*" onChange={handleChiImageUpload} className="hidden" />
                    </label>

                    {previewChiImage && (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                        <img src={previewChiImage} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setMinhChungChi(''); setPreviewChiImage(null); }}
                          className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] p-0.5 rounded-bl">
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  <input
                    type="url"
                    placeholder="Hoặc dán đường dẫn URL hóa đơn (https://...)..."
                    value={minhChungChi}
                    onChange={(e) => {
                      setMinhChungChi(e.target.value);
                      if (e.target.value.startsWith('http')) setPreviewChiImage(e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl font-semibold">Hủy</button>
                  <button 
                    type="submit" 
                    disabled={isVuotHanMuc}
                    className={`px-4 py-2 text-xs font-bold rounded-xl shadow-md transition ${
                      isVuotHanMuc 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}>
                    Xác nhận chi tiền
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL YÊU CẦU RÚT TIỀN / QUYẾT TOÁN CỦA THỦ QUỶ */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Wallet size={16} className="text-amber-400" /> Rút quỹ về Ví cá nhân Thủ quỹ
              </h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Số dư Quỹ khả dụng</span>
                <strong className="text-emerald-400 text-sm font-bold block">
                  {(group?.soDuQuy || 0).toLocaleString('vi-VN')} {loaiTien}
                </strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Tiền bạn đang giữ</span>
                <strong className="text-amber-400 text-sm font-bold block">
                  {((currentUser as any)?.soTienDangGiu || 0).toLocaleString('vi-VN')} {loaiTien}
                </strong>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300 space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <Info size={14} /> Cơ chế rút quỹ:
              </p>
              <p className="text-[11px] text-slate-300">
                Khi thực hiện rút quỹ, tiền từ <strong>Quỹ nhóm (`soDuQuy`)</strong> sẽ được trừ và cộng tương ứng vào <strong>Số tiền Thủ quỹ đang giữ (`soTienDangGiu`)</strong> để sẵn sàng chi trả.
              </p>
            </div>

            <form onSubmit={handleRequestWithdrawal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Số tiền rút ({loaiTien}) (*)
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  max={group?.soDuQuy || 0}
                  placeholder="Nhập số tiền muốn rút..."
                  value={soTienRut}
                  onChange={(e) => setSoTienRut(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nội dung rút tiền (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Rút tiền chuẩn bị chi trả giao lưu..."
                  value={noiDungRut}
                  onChange={(e) => setNoiDungRut(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowWithdrawModal(false)} 
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl font-semibold">
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition">
                  Xác nhận Rút Quỹ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GÁN VAI TRÒ */}
      {selectedMemberRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xs w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck size={16} className="text-emerald-400" />
                Gán vai trò: {selectedMemberRoleModal.hoTen}
              </h3>
              <button onClick={() => setSelectedMemberRoleModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              <button
                onClick={() => handleAssignRole(selectedMemberRoleModal.maThanhVienNhom, 'QUAN_TRI')}
                className={`w-full py-2 px-3 border rounded-xl font-semibold text-xs flex items-center justify-between transition ${
                  selectedMemberRoleModal.danhSachVaiTro?.includes('QUAN_TRI')
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}>
                <span>{selectedMemberRoleModal.danhSachVaiTro?.includes('QUAN_TRI') ? '✓ Quản trị viên' : '+ Quản trị viên'}</span>
                <Shield size={14} />
              </button>

              <button
                onClick={() => handleAssignRole(selectedMemberRoleModal.maThanhVienNhom, 'THU_QUY')}
                className={`w-full py-2 px-3 border rounded-xl font-semibold text-xs flex items-center justify-between transition ${
                  selectedMemberRoleModal.danhSachVaiTro?.includes('THU_QUY')
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}>
                <span>{selectedMemberRoleModal.danhSachVaiTro?.includes('THU_QUY') ? '✓ Thủ quỹ' : '+ Thủ quỹ'}</span>
                <Wallet size={14} />
              </button>

              <button
                onClick={() => handleAssignRole(selectedMemberRoleModal.maThanhVienNhom, 'THANH_VIEN')}
                className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl font-semibold text-xs flex items-center justify-between transition">
                <span>Đặt về Thành viên thường</span>
                <Users size={14} />
              </button>
            </div>

            <div className="pt-2 text-right">
              <button onClick={() => setSelectedMemberRoleModal(null)} className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PHÓNG TO MÃ VIETQR HOẶC ẢNH MINH CHỨNG */}
      {enlargedQrUrl && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in cursor-pointer"
          onClick={() => setEnlargedQrUrl(null)}>
          <div className="relative max-w-lg w-full p-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setEnlargedQrUrl(null)} 
              className="absolute top-4 right-4 text-white bg-slate-800/80 p-2 rounded-full hover:bg-slate-700 transition z-10">
              <X size={20} />
            </button>
            <img src={enlargedQrUrl} alt="Ảnh Phóng To" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
};