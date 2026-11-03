import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Save, CheckCircle2, AlertCircle, KeyRound, ShieldCheck, ExternalLink, CreditCard, QrCode, Upload, Trash2, Crop } from 'lucide-react';
import { apiService } from '../api/services';
import type { UserProfile } from '../api/services';
import keycloak from '../keycloak';
import { ImageCropperModal } from '../components/ImageCropperModal';

interface ProfileProps {
  user: UserProfile | null;
  onRefresh: () => void;
}

export const ProfilePage: React.FC<ProfileProps> = ({ user, onRefresh }) => {
  const [hoTen, setHoTen] = useState(user?.hoTen || '');
  const [soDienThoai, setSoDienThoai] = useState(user?.soDienThoai || '');
  const [email, setEmail] = useState(user?.email || '');
  const [tenNganHang, setTenNganHang] = useState(user?.tenNganHang || '');
  const [soTaiKhoan, setSoTaiKhoan] = useState(user?.soTaiKhoan || '');
  const [tenChuTaiKhoan, setTenChuTaiKhoan] = useState(user?.tenChuTaiKhoan || '');
  const [qrThanhToanUrl, setQrThanhToanUrl] = useState(user?.qrThanhToanUrl || '');

  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [tempQrSrc, setTempQrSrc] = useState<string>('');

  useEffect(() => {
    if (user) {
      setHoTen(user.hoTen || '');
      setSoDienThoai(user.soDienThoai || '');
      setEmail(user.email || '');
      setTenNganHang(user.tenNganHang || '');
      setSoTaiKhoan(user.soTaiKhoan || '');
      setTenChuTaiKhoan(user.tenChuTaiKhoan || '');
      setQrThanhToanUrl(user.qrThanhToanUrl || '');
    }
  }, [user]);

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Kích thước ảnh tối đa là 10MB!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempQrSrc(reader.result as string);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      await apiService.updateProfile({
        hoTen,
        soDienThoai: soDienThoai.trim() ? soDienThoai.trim() : undefined,
        email,
        tenNganHang,
        soTaiKhoan,
        tenChuTaiKhoan,
        qrThanhToanUrl
      });
      setStatusMsg({ type: 'success', msg: 'Cập nhật thông tin cá nhân thành công!' });
      onRefresh();
    } catch (err: any) {
      setStatusMsg({ type: 'error', msg: err.response?.data?.message || 'Cập nhật thất bại!' });
    } finally { // <-- Thay 'fontally' thành 'finally'
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    keycloak.login({
      action: 'UPDATE_PASSWORD',
    });
  };

  const handleUpdateKeycloakAccount = () => {
    keycloak.accountManagement();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Cấu hình tài khoản</h2>
        <p className="text-slate-400 text-sm mt-1">Quản lý thông tin cá nhân và tài khoản nhận tiền VietQR.</p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {statusMsg.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-up">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <User className="text-emerald-400" size={20} />
            <h3 className="text-base font-bold text-white">Thông tin cá nhân</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Họ và tên (*)</label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Nhập họ và tên..."
                  value={hoTen}
                  onChange={(e) => setHoTen(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Số điện thoại</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Nhập số điện thoại..."
                    value={soDienThoai}
                    onChange={(e) => setSoDienThoai(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email (*)</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="email"
                    placeholder="Nhập địa chỉ email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Khối Ngân Hàng & Mã VietQR */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-up">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <CreditCard className="text-blue-400" size={20} />
            <h3 className="text-base font-bold text-white">Tài khoản ngân hàng & Mã VietQR</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tên ngân hàng</label>
              <input
                type="text"
                placeholder="Nhập tên ngân hàng..."
                value={tenNganHang}
                onChange={(e) => setTenNganHang(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Số tài khoản</label>
              <input
                type="text"
                placeholder="Nhập số tài khoản..."
                value={soTaiKhoan}
                onChange={(e) => setSoTaiKhoan(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tên chủ tài khoản</label>
              <input
                type="text"
                placeholder="Nhập tên chủ tài khoản..."
                value={tenChuTaiKhoan}
                onChange={(e) => setTenChuTaiKhoan(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm transition"
              />
            </div>

            <div className="sm:col-span-2 space-y-3 pt-2 border-t border-slate-800/80">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <QrCode size={16} className="text-amber-400" /> Tải lên mã VietQR
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer px-4 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 rounded-xl text-xs font-bold text-slate-200 transition flex items-center gap-2">
                  <Upload size={16} className="text-amber-400" />
                  <span>Chọn ảnh từ thiết bị</span>
                  <input type="file" accept="image/*" onChange={handleQrImageUpload} className="hidden" />
                </label>

                {qrThanhToanUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setTempQrSrc(qrThanhToanUrl);
                        setIsCropperOpen(true);
                      }}
                      className="px-3 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
                      <Crop size={15} /> Cắt / Phóng to
                    </button>

                    <button
                      type="button"
                      onClick={() => setQrThanhToanUrl('')}
                      className="px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
                      <Trash2 size={15} /> Xóa ảnh
                    </button>
                  </>
                )}
              </div>

              {qrThanhToanUrl ? (
                <div className="mt-3 p-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center max-w-xs shadow-md">
                  <span className="text-[10px] text-emerald-400 mb-2 font-bold uppercase tracking-wider flex items-center gap-1">
                    ✓ Ảnh mã VietQR:
                  </span>
                  <img src={qrThanhToanUrl} alt="Mã VietQR" className="max-h-56 object-contain rounded-xl border border-slate-800" />
                </div>
              ) : (
                <p className="text-xs text-slate-500">Chưa tải lên ảnh mã VietQR.</p>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition text-sm shadow-lg shadow-emerald-500/20"
            >
              <Save size={18} />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </form>

      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-up">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
          <ShieldCheck className="text-amber-400" size={20} />
          <h3 className="text-base font-bold text-white">Bảo mật & Tài khoản Keycloak</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound size={16} className="text-amber-400" /> Thay đổi mật khẩu
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Thay đổi mật khẩu tài khoản hệ thống Keycloak.
              </p>
            </div>
            <button
              onClick={handleChangePassword}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/20 font-semibold px-4 py-2.5 rounded-xl transition text-xs shrink-0"
            >
              Đổi mật khẩu <ExternalLink size={14} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <User size={16} className="text-emerald-400" /> Hồ sơ xác thực Keycloak
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Quản lý email chính, lịch sử thiết bị và bảo mật trên Keycloak.
              </p>
            </div>
            <button
              onClick={handleUpdateKeycloakAccount}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/20 font-semibold px-4 py-2.5 rounded-xl transition text-xs shrink-0"
            >
              Hồ sơ Keycloak <ExternalLink size={14} />
            </button>
          </div>
        </div>
      </div>

      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={tempQrSrc}
        aspectRatio={1}
        title="Chỉnh Sửa Mã VietQR"
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={(croppedBase64) => {
          setQrThanhToanUrl(croppedBase64);
        }}
      />
    </div>
  );
};