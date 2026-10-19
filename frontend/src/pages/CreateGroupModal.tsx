import React, { useState } from 'react';
import { Shield, Vote, Lock, Globe, DollarSign } from 'lucide-react';
import axiosClient from '../api/axiosClient';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tenNhom, setTenNhom] = useState('');
  const [moTa, setMoTa] = useState('');
  const [loaiTienTe, setLoaiTienTe] = useState('VND');
  const [cheDoRiengTu, setCheDoRiengTu] = useState<'PUBLIC' | 'RIENG_TU'>('RIENG_TU');
  const [mucTieuQuy, setMucTieuQuy] = useState<number>(0);
  
  // Công tắc chính sách
  const [batPheDuyet, setBatPheDuyet] = useState(true);
  const [batBieuQuyet, setBatBieuQuyet] = useState(false);
  const [thoiHanBieuQuyetGio, setThoiHanBieuQuyetGio] = useState(24);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        tenNhom: tenNhom.trim(),
        moTa: moTa ? moTa.trim() : '',
        // CHÚ Ý 1: Ép kiểu số, nếu để trống ô mục tiêu thì gửi null (KHÔNG gửi chuỗi rỗng "")
        mucTieuQuy: (mucTieuQuy !== null && mucTieuQuy !== undefined && mucTieuQuy !== null) 
          ? Number(mucTieuQuy) 
          : null,
        // CHÚ Ý 2: Chỉ gửi mã "VND" hoặc "USD"
        loaiTienTe: loaiTienTe || 'VND', 
        cheDoRiengTu: cheDoRiengTu, // 'PUBLIC' hoặc 'RIENG_TU'
        batPheDuyet: batPheDuyet ?? true,
        batBieuQuyet: batPheDuyet ? (batBieuQuyet ?? false) : false,
      };

      await axiosClient.post('/groups', payload);
      alert('Tạo nhóm thành công!');
      onClose(); // Đóng modal
      onSuccess?.(); // Refresh lại danh sách
    } catch (err: any) {
      console.error('Lỗi khi tạo nhóm:', err?.response?.data);
      // Hiển thị dòng lỗi cụ thể do Backend trả về
      const backendMsg = err?.response?.data?.message || JSON.stringify(err?.response?.data);
      alert(`Lỗi tạo nhóm: ${backendMsg}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" /> Tạo Nhóm Quỹ Mới
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên nhóm quỹ *</label>
            <input
              type="text"
              required
              value={tenNhom}
              onChange={(e) => setTenNhom(e.target.value)}
              placeholder="Ví dụ: Quỹ Lớp K65, Quỹ Du Lịch Công Ty..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả nhóm</label>
            <textarea
              value={moTa}
              onChange={(e) => setMoTa(e.target.value)}
              rows={2}
              placeholder="Mục đích sử dụng quỹ..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Loaị tiền tệ
              </label>
              <select
                value={loaiTienTe}
                onChange={(e) => setLoaiTienTe(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
              >
                <option value="VND">VND (Việt Nam Đồng)</option>
                <option value="USD">USD (Đô la Mỹ)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="JPY">JPY (Yên Nhật)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mục tiêu quỹ</label>
              <input
                type="number"
                value={mucTieuQuy}
                onChange={(e) => setMucTieuQuy(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Chế độ nhóm</label>
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
                <Lock className="w-4 h-4" /> Riêng tư (Chỉ mã tham gia)
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
                <Globe className="w-4 h-4" /> Công khai (Tất cả thấy)
              </button>
            </div>
          </div>

          {/* CẤU HÌNH CHÍNH SÁCH PHÊ DUYỆT & BIỂU QUYẾT */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Cấu hình chính sách phê duyệt</h3>

            {/* Toggle 1: Bật Phê Duyệt */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Yêu cầu Phê duyệt Thu / Chi</span>
                <span className="text-[11px] text-slate-500">Mọi khoản thu/chi phải thông qua Thủ quỹ duyệt</span>
              </div>
              <input
                type="checkbox"
                checked={batPheDuyet}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setBatPheDuyet(checked);
                  // Tắt phê duyệt -> Bắt buộc tắt biểu quyết
                  if (!checked) setBatBieuQuyet(false);
                }}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </div>

            {/* Toggle 2: Bật Biểu Quyết */}
            <div className={`flex items-center justify-between p-3 rounded-xl border transition ${
              !batPheDuyet ? 'bg-slate-100 opacity-60 border-slate-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Vote className="w-3.5 h-3.5 text-indigo-600" /> Bật Biểu quyết cho Khoản Chi
                </span>
                <span className="text-[11px] text-slate-500">Đề xuất chi phải được &gt;50% thành viên đồng ý trước khi Thủ quỹ duyệt</span>
              </div>
              <input
                type="checkbox"
                disabled={!batPheDuyet} // Lock khi Phê duyệt bị tắt
                checked={batBieuQuyet}
                onChange={(e) => setBatBieuQuyet(e.target.value === 'true' || e.target.checked)}
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
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Đang khởi tạo...' : 'Tạo nhóm quỹ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};