import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, UserPlus, ArrowRight, Users, Shield, Vote, 
  Lock, Globe, DollarSign 
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

interface NhomQuy {
  maNhom: number;
  tenNhom: string;
  moTa: string;
  maThamGia: string;
  trangThai: string;
  mucTieuQuy?: number | null;
  soDuHienTai?: number;
  loaiTienTe?: string;
  cheDoRiengTu?: string;
}

const extractData = (res: any) => {
  if (!res || !res.data) return [];
  if (Array.isArray(res.data)) return res.data;
  if (res.data.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<NhomQuy[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Form State: Tạo nhóm cơ bản
  const [tenNhom, setTenNhom] = useState('');
  const [moTa, setMoTa] = useState('');
  const [loaiTienTe, setLoaiTienTe] = useState('VND');
  const [cheDoRiengTu, setCheDoRiengTu] = useState<'PUBLIC' | 'RIENG_TU'>('RIENG_TU');
  // Chuyển mặc định sang null (Không bắt buộc)
  const [mucTieuQuy, setMucTieuQuy] = useState<number | null>(null);

  // Form State: Cấu hình chính sách phê duyệt & biểu quyết
  const [batPheDuyet, setBatPheDuyet] = useState(true);
  const [batBieuQuyet, setBatBieuQuyet] = useState(false);
  const [thoiHanBieuQuyetGio, setThoiHanBieuQuyetGio] = useState(24);

  // Form State: Gia nhập nhóm
  const [joinCode, setJoinCode] = useState('');

  const fetchMyGroups = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/groups/my-groups');
      setGroups(extractData(res));
    } catch (err) {
      console.error('Lỗi nạp danh sách nhóm:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post('/groups', {
        tenNhom,
        moTa,
        loaiTienTe,
        cheDoRiengTu,
        mucTieuQuy, // Truyền trực tiếp number hoặc null
        batPheDuyet,
        batBieuQuyet: batPheDuyet ? batBieuQuyet : false,
        thoiHanBieuQuyetGio,
      });

      setShowCreateModal(false);
      // Reset Form
      setTenNhom('');
      setMoTa('');
      setLoaiTienTe('VND');
      setCheDoRiengTu('RIENG_TU');
      setMucTieuQuy(null);
      setBatPheDuyet(true);
      setBatBieuQuyet(false);
      setThoiHanBieuQuyetGio(24);

      fetchMyGroups();
    } catch (err: any) {
      alert(`Lỗi tạo nhóm: ${err?.response?.data?.message || 'Vui lòng kiểm tra lại thông tin!'}`);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post(`/groups/join?maThamGia=${joinCode.trim()}`);
      setShowJoinModal(false);
      setJoinCode('');
      fetchMyGroups();
    } catch (err: any) {
      alert(`Mã tham gia không chính xác hoặc bạn đã ở trong nhóm này rồi!`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ACTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Danh Sách Nhóm Quỹ Của Tôi</h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý thu chi minh bạch, phê duyệt khoản nộp và biểu quyết ngân sách nhóm
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition"
          >
            <UserPlus className="w-4 h-4 text-slate-500" />
            Nhập mã tham gia
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Tạo nhóm mới
          </button>
        </div>
      </div>

      {/* DANH SÁCH NHÓM QUĨ */}
      <div>
        {loading ? (
          <div className="text-center py-16 text-slate-400 font-medium text-xs">Đang nạp danh sách nhóm...</div>
        ) : groups.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Bạn chưa tham gia nhóm quỹ nào</h3>
            <p className="text-xs text-slate-500 mt-1">Hãy tạo nhóm quỹ mới hoặc nhập mã tham gia từ quản trị viên.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => {
              const currencyUnit = group.loaiTienTe || 'VND';

              return (
                <div
                  key={group.maNhom}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                        Mã: {group.maThamGia}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        group.cheDoRiengTu === 'PUBLIC' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {group.cheDoRiengTu === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-1">{group.tenNhom}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] mb-4">
                      {group.moTa || 'Chưa có mô tả nhóm'}
                    </p>

                    <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mục tiêu quỹ:</span>
                        <span className="font-semibold text-slate-700">
                          {group.mucTieuQuy && group.mucTieuQuy > 0
                            ? `${group.mucTieuQuy.toLocaleString()} ${currencyUnit}`
                            : 'Không đặt mục tiêu'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Số dư hiện tại:</span>
                        <span className="font-extrabold text-emerald-600">
                          {(group.soDuHienTai ?? 0).toLocaleString()} {currencyUnit}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/groups/${group.maNhom}`)}
                    className="mt-5 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition"
                  >
                    Vào trang quản trị <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL TẠO NHÓM CHUẨN ĐẦY ĐỦ CẤU HÌNH */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" /> Tạo Nhóm Quỹ & Thiết Lập Chính Sách
            </h3>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              {/* Tên & Mô tả */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên nhóm quỹ *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Quỹ Lớp K65, Quỹ Du Lịch Công Ty..."
                  value={tenNhom}
                  onChange={(e) => setTenNhom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả nhóm</label>
                <textarea
                  placeholder="Mục đích sử dụng quỹ..."
                  value={moTa}
                  onChange={(e) => setMoTa(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Loại tiền tệ & Mục tiêu quỹ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Loại tiền tệ *
                  </label>
                  <select
                    value={loaiTienTe}
                    onChange={(e) => setLoaiTienTe(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="VND">VND (Việt Nam Đồng)</option>
                    <option value="USD">USD (Đô la Mỹ)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="JPY">JPY (Yên Nhật)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mục tiêu quỹ <span className="text-slate-400 font-normal">(Không bắt buộc)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Để trống nếu thu/chi tự do"
                    value={mucTieuQuy ?? ''}
                    onChange={(e) => setMucTieuQuy(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Chế độ Riêng tư / Công khai */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chế độ hiển thị nhóm</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCheDoRiengTu('RIENG_TU')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      cheDoRiengTu === 'RIENG_TU'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Lock className="w-4 h-4" /> Riêng tư (Cần mã)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheDoRiengTu('PUBLIC')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      cheDoRiengTu === 'PUBLIC'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Globe className="w-4 h-4" /> Công khai
                  </button>
                </div>
              </div>

              {/* CẤU HÌNH CHÍNH SÁCH PHÊ DUYỆT VÀ BIỂU QUYẾT */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Cấu hình chính sách phê duyệt</h4>

                {/* Toggle 1: Yêu cầu phê duyệt */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Bật Phê Duyệt Thu / Chi</span>
                    <span className="text-[11px] text-slate-500">Mọi bản thu/chi bắt buộc Thủ quỹ/Admin duyệt mới trừ số dư</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={batPheDuyet}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setBatPheDuyet(checked);
                      if (!checked) setBatBieuQuyet(false);
                    }}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Toggle 2: Bật Biểu quyết */}
                <div className={`flex items-center justify-between p-3 rounded-xl border transition ${
                  !batPheDuyet ? 'bg-slate-100 opacity-60 border-slate-200' : 'bg-slate-50 border-slate-200'
                }`}>
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
                    disabled={!batPheDuyet}
                    checked={batBieuQuyet}
                    onChange={(e) => setBatBieuQuyet(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 disabled:cursor-not-allowed"
                  />
                </div>

                {batBieuQuyet && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Thời hạn biểu quyết (giờ)</label>
                    <input
                      type="number"
                      value={thoiHanBieuQuyetGio}
                      onChange={(e) => setThoiHanBieuQuyetGio(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition"
                >
                  Tạo nhóm ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GIA NHẬP NHÓM BẰNG MÃ */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-3">Gia Nhập Nhóm Bằng Mã</h3>
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nhập mã tham gia (Join Code)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: ABC123XYZ"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition"
                >
                  Gia nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};