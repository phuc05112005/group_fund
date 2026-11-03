import axiosClient from './axiosClient';

// --- INTERFACES ---

export interface UserProfile {
  maNguoiDung: number;
  keycloakUserId: string;
  hoTen: string;
  soDienThoai?: string;
  email: string;
  trangThai: string;
  tenNganHang?: string;
  soTaiKhoan?: string;
  tenChuTaiKhoan?: string;
  qrThanhToanUrl?: string;
  ngayTao: string;
  ngayCapNhat?: string;
}

export interface GroupFund {
  maNhom: number;
  maMoi?: string;
  tenNhom: string;
  moTa?: string;
  loaiTienTe?: string;
  cheDoRiengTu: 'RIENG_TU' | 'CONG_KHAI';
  soDuQuy: number;
  soDuCaNhan?: number;
  mucTieuQuy: number;
  trangThai: string;
  ngayTao?: string;
  trangThaiYeuCau?: string;
}

export interface ThanhVienGroup {
  maThanhVienNhom: number;
  hoTen: string;
  email: string;
  soDuCaNhan: number;
  soTienDangGiu: number;
  trangThaiThanhVien: string;
  danhSachVaiTro: string[];
  nguoiDung?: UserProfile;
}

export interface JoinRequest {
  maYeuCau: string;
  maNhom: number;
  maNguoiDungEmail: string;
  hoTen: string;
  trangThai: 'CHO_DUYET' | 'CHAP_NHAN' | 'TU_CHOI';
  ngayTao: string;
}

export interface ChiTietDeXuatItem {
  maChiTietDeXuat?: number;
  deXuatId?: number;
  thanhVienId: number;
  soTienPhanBo: number;
  ghiChu?: string;
}

export interface VoteItem {
  maThanhVien?: number;
  thanhVienId?: number;
  tenThanhVien?: string;
  hoTen?: string;
  luaChon?: 'DONG_Y' | 'TU_CHOI';
  dongY?: boolean;
  ngayTao?: string;
  ngayBieuQuyet?: string;
}

export interface Proposal {
  maDeXuat: number;
  tieuDe: string;
  tenDeXuat?: string;
  moTa?: string;
  mucDich?: string;
  loaiDeXuat: 'THU' | 'CHI';
  kieuPhanBo: string;
  soTienTong: number;
  soTienDeXuat?: number;
  tyLeDongY?: number;
  tyLeToiThieu?: number;
  coBieuQuyet: boolean;
  danhSachThanhVienBieuQuyet?: number[];
  trangThai: 'CHO_DUYET' | 'DA_THONG_QUA' | 'TU_CHOI' | 'HUY' | 'DA_HUY';
  nguoiTao?: {
    maThanhVienNhom?: number;
    hoTen?: string;
    nguoiDung?: {
      keycloakUserId?: string;
    };
  };
  nguoiTaoName?: string;
  maThanhVienTao?: number;
  ngayTao: string;
  danhSachChiTiet?: ChiTietDeXuatItem[];
  chiTietList?: ChiTietDeXuatItem[];
  danhSachPhieuBau?: VoteItem[];
}

export interface Transaction {
  maKhoanNop?: number;
  id?: string;
  maNhom?: number | string;
  noiDung?: string;
  tenThanhVien?: string;
  nguoiNopName?: string;
  soTien: number;
  phuongThuc: string;
  minhChung?: string;
  trangThai: 'CHO_XAC_NHAN' | 'DA_XAC_NHAN' | 'TU_CHOI';
  ngayKhaiBao?: string;
  ngayNop?: string;
  thuQuyNhanName?: string;
  nguoiNop?: {
    hoTen: string;
    email: string;
  };
}

export interface ExpenseTransaction {
  maKhoanChi?: number;
  maChiTietKhoanChi?: number;
  id?: string;
  maNhom?: number | string;
  noiDung?: string;
  noiDungChi?: string;
  thuQuyThucHienName?: string;
  tenNguoiChi?: string;
  nguoiNhanChiName?: string;
  soTienTong?: number;
  soTien?: number;
  phuongThuc?: string;
  minhChung?: string;
  trangThai?: 'CHO_XAC_NHAN' | 'DA_XAC_NHAN' | 'TU_CHOI';
  ngayChi?: string;
  ngayTao?: string;
  loaiPhanBo?: string;
}

export interface VotingPolicy {
  maChinhSach?: number;
  tyLeDongYToiThieu: number;
  thoiGianHieuLucHours: number;
  anDanhNguoiVote?: boolean;
  anDanh?: boolean;
  coAnDanh?: boolean;
  isAnonymous?: boolean;
  [key: string]: any;
}

export interface AppNotification {
  id: string;
  maThanhVienNhom?: number;
  maThongBao?: number;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: string;
  nguoiGui?: string;
  soTien?: number;
  link?: string;
  maNhom?: number;
  deXuatId?: number;
  giaoDichId?: number;
  rawObject?: any;
}

// --- LOCAL STORAGE CACHE HELPERS ---

export const localStore = {
  saveVote: (deXuatId: number, vote: VoteItem) => {
    const key = `groupfund_votes_${deXuatId}`;
    const existing: VoteItem[] = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = existing.filter(v => (v.maThanhVien || v.thanhVienId) !== (vote.maThanhVien || vote.thanhVienId));
    localStorage.setItem(key, JSON.stringify([...filtered, vote]));
  },

  getVotes: (deXuatId: number): VoteItem[] => {
    const key = `groupfund_votes_${deXuatId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  saveExpense: (maNhom: number | string, item: ExpenseTransaction) => {
    const keyGroup = `groupfund_local_expenses_${maNhom}`;
    const existingGroup = JSON.parse(localStorage.getItem(keyGroup) || '[]');
    localStorage.setItem(keyGroup, JSON.stringify([item, ...existingGroup]));
  },

  getExpenses: (maNhom: number | string): ExpenseTransaction[] => {
    const keyGroup = `groupfund_local_expenses_${maNhom}`;
    return JSON.parse(localStorage.getItem(keyGroup) || '[]');
  },

  saveDeposit: (maNhom: number | string, item: Transaction) => {
    const keyGroup = `groupfund_local_deposits_${maNhom}`;
    const existingGroup = JSON.parse(localStorage.getItem(keyGroup) || '[]');
    localStorage.setItem(keyGroup, JSON.stringify([item, ...existingGroup]));
  },

  getDeposits: (maNhom: number | string): Transaction[] => {
    const keyGroup = `groupfund_local_deposits_${maNhom}`;
    return JSON.parse(localStorage.getItem(keyGroup) || '[]');
  },

  addNotification: (title: string, message: string, type: string = 'SYSTEM', maNhom?: number, deXuatId?: number, giaoDichId?: number) => {
    const key = 'groupfund_local_notifications';
    const existing: AppNotification[] = JSON.parse(localStorage.getItem(key) || '[]');
    const now = new Date();
    
    let linkVal = undefined;
    if (maNhom) {
      if (deXuatId) linkVal = `/groups/${maNhom}?deXuatId=${deXuatId}`;
      else if (giaoDichId) linkVal = `/groups/${maNhom}?giaoDichId=${giaoDichId}`;
      else linkVal = `/groups/${maNhom}`;
    }

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random()}`,
      title,
      message,
      time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString('vi-VN'),
      unread: true,
      type,
      maNhom,
      deXuatId,
      giaoDichId,
      link: linkVal
    };
    localStorage.setItem(key, JSON.stringify([newNotif, ...existing]));
    window.dispatchEvent(new Event('groupfund_notif_updated'));
  },

  // Sửa lỗi đọc toàn bộ danh sách nộp local quét theo tiền tố key
  getAllDepositsLocal: (): Transaction[] => {
    try {
      const results: Transaction[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('groupfund_local_deposits_') || key === 'local_deposits')) {
          const items = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(items)) results.push(...items);
        }
      }
      return results;
    } catch (e) {
      console.error('Lỗi lấy local deposits:', e);
      return [];
    }
  },

  // Sửa lỗi đọc toàn bộ danh sách chi local quét theo tiền tố key
  getAllExpensesLocal: (): ExpenseTransaction[] => {
    try {
      const results: ExpenseTransaction[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('groupfund_local_expenses_') || key === 'local_expenses')) {
          const items = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(items)) results.push(...items);
        }
      }
      return results;
    } catch (e) {
      console.error('Lỗi lấy local expenses:', e);
      return [];
    }
  },

  getNotifications: (): AppNotification[] => {
    const key = 'groupfund_local_notifications';
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  markNotifRead: (id: string) => {
    const key = 'groupfund_local_notifications';
    const existing: AppNotification[] = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = existing.map(n => n.id === id ? { ...n, unread: false } : n);
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new Event('groupfund_notif_updated'));
  },

  markAllNotifsRead: () => {
    const key = 'groupfund_local_notifications';
    const existing: AppNotification[] = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = existing.map(n => ({ ...n, unread: false }));
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new Event('groupfund_notif_updated'));
  }
};

// --- API SERVICES ---

export const apiService = {
  syncUser: (data: { hoTen: string; soDienThoai?: string; email: string }) =>
    axiosClient.post<UserProfile>('/nguoi-dung/sync', data),

  getProfile: () => axiosClient.get<UserProfile>('/nguoi-dung/me'),
  getPendingJoinRequests: (maNhom: number | string) =>
    axiosClient.get(`/nhom-quy/${maNhom}/yeu-cau-tham-gia`),

  approveJoinRequest: (maYeuCau: number, dongY: boolean) =>
    axiosClient.post(`/nhom-quy/yeu-cau-tham-gia/${maYeuCau}/duyet?dongY=${dongY}`),

  updateProfile: (data: {
    hoTen: string;
    soDienThoai?: string;
    email?: string;
    tenNganHang?: string;
    soTaiKhoan?: string;
    tenChuTaiKhoan?: string;
    qrThanhToanUrl?: string;
  }) => axiosClient.put<UserProfile>('/nguoi-dung/me', data),

  getGroups: () => axiosClient.get<GroupFund[]>('/nhom-quy'),

  createGroup: (data: {
    tenNhom: string;
    moTa?: string;
    loaiTienTe?: string;
    cheDoRiengTu?: string;
    mucTieuQuy?: number;
  }) => axiosClient.post<GroupFund>('/nhom-quy/tao-nhom', data),

  joinGroupByCode: (maMoi: string) =>
    axiosClient.post<GroupFund>(`/nhom-quy/tham-gia?maMoi=${maMoi}`),

  getGroupDetail: (maNhom: number | string) =>
    axiosClient.get<GroupFund>(`/nhom-quy/${maNhom}`),

  closeGroup: (maNhom: number | string) =>
    axiosClient.put<string>(`/nhom-quy/${maNhom}/dong-nhom`),

  updateGroup: (maNhom: number | string, data: { tenNhom?: string; moTa?: string; cheDoRiengTu?: string; mucTieuQuy?: number }) =>
    axiosClient.put<GroupFund>(`/nhom-quy/${maNhom}`, data),

  getMembersInGroup: (maNhom: number | string) =>
    axiosClient.get<ThanhVienGroup[]>(`/nhom-quy/${maNhom}/thanh-vien`),

  assignRole: (maThanhVien: number, tenVaiTro: string) =>
    axiosClient.post(`/thanh-vien-nhom/${maThanhVien}/vai-tro?tenVaiTro=${tenVaiTro}`),

  getProposalsInGroup: (maNhom: number | string) =>
    axiosClient.get<Proposal[]>(`/nhom-quy/${maNhom}/de-xuat`),

  createProposal: (
    maNhom: number | string,
    data: {
      nhomId?: number;
      tieuDe: string;
      mucDich?: string;
      loaiDeXuat: 'THU' | 'CHI';
      kieuPhanBo: string;
      soTienTong: number;
      coBieuQuyet?: boolean;
      tyLeToiThieu?: number;
      anDanhNguoiVote?: boolean;
      danhSachThanhVienBieuQuyet?: number[];
      chiTietItems?: ChiTietDeXuatItem[];
    },
    maThanhVienTao?: number
  ) => {
    const url = maThanhVienTao 
      ? `/nhom-quy/${maNhom}/de-xuat?maThanhVienTao=${maThanhVienTao}` 
      : `/nhom-quy/${maNhom}/de-xuat`;
    return axiosClient.post<Proposal>(url, data);
  },

  revokeProposal: (maDeXuat: number) =>
    axiosClient.post<string>(`/de-xuat/${maDeXuat}/thu-hoi`),

  voteProposal: (maDeXuat: number, maThanhVien: number, dongY: boolean) =>
    axiosClient.post(`/de-xuat/${maDeXuat}/bieu-quyet?maThanhVien=${maThanhVien}`, {
      deXuatId: maDeXuat,
      luaChon: dongY ? 'DONG_Y' : 'TU_CHOI'
    }),

  getVotingPolicy: (maNhom: number | string) =>
    axiosClient.get<VotingPolicy>(`/nhom-quy/${maNhom}/chinh-sach`),

  updateVotingPolicy: (
    maNhom: number | string, 
    data: { 
      tyLeDongYToiThieu: number; 
      thoiGianHieuLucHours: number; 
      anDanhNguoiVote?: boolean;
      anDanh?: boolean;
      coAnDanh?: boolean;
      isAnonymous?: boolean;
      [key: string]: any;
    }
  ) => axiosClient.put<VotingPolicy>(`/nhom-quy/${maNhom}/chinh-sach`, data),

  getTransactionsByGroup: (maNhom: number | string) =>
    axiosClient.get<Transaction[]>(`/khoan-nop/nhom-quy/${maNhom}`),

  getExpensesByGroup: (maNhom: number | string) =>
    axiosClient.get<ExpenseTransaction[]>(`/khoan-chi/nhom-quy/${maNhom}`)
      .catch(() => ({ data: [] as ExpenseTransaction[] })),

  getTransactions: () => axiosClient.get<Transaction[]>('/khoan-nop'),

  getAllExpenses: () => axiosClient.get<ExpenseTransaction[]>('/khoan-chi'),

  createDeposit: (data: {
    nguoiNopId: number;
    soTien: number;
    phuongThuc: string;
    noiDung: string;
    thuQuyNhanId: number;
    chiTietDeXuatId?: number;
    minhChung?: string;
  }) => axiosClient.post('/khoan-nop', data),

  confirmDeposit: (maKhoanNop: number, trangThai: 'DA_XAC_NHAN' | 'TU_CHOI', thuQuyThucHienId?: number) => 
    axiosClient.put(`/khoan-nop/${maKhoanNop}/xac-nhan?trangThai=${trangThai}${thuQuyThucHienId ? `&thuQuyThucHienId=${thuQuyThucHienId}` : ''}`),

  createExpense: (data: {
    maNhom: number;
    thuQuyThucHienId: number;
    nguoiNhanChiId: number;
    soTien: number;
    loaiPhanBo: string;
    phuongThuc?: string;
    noiDung: string;
    minhChung?: string;
    chiTietDeXuatId?: number;
    dsPhanBo?: Array<{ thanhVienId: number; soTienTru: number }>;
  }) => axiosClient.post('/khoan-chi', data),

  confirmExpense: (maKhoanChi: number, trangThai: 'DA_XAC_NHAN' | 'TU_CHOI', nguoiNhanId?: number) => 
    axiosClient.put(`/khoan-chi/${maKhoanChi}/xac-nhan?trangThai=${trangThai}${nguoiNhanId ? `&nguoiNhanId=${nguoiNhanId}` : ''}`),


  createVNPayPayment: (data: {
    nguoiNopId: number;
    thuQuyNhanId?: number;
    soTien: number;
    noiDung?: string;
    chiTietDeXuatId?: number;
  }) => axiosClient.post<{ paymentUrl: string }>('/vnpay/create-payment', data),

  handleVNPayCallback: (queryParams: Record<string, string>) =>
    axiosClient.get<{ success: boolean; message: string }>('/vnpay/callback', { params: queryParams }),

  requestWithdrawal: (data: {
    maNhom: number;
    thuQuyId: number;
    soTien: number;
    noiDung: string;
    tenNganHang: string;
    soTaiKhoan: string;
    tenChuTaiKhoan: string;
  }) => axiosClient.post('/yeu-cau-rut-tien', data),

  
};