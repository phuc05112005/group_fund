import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { apiService } from '../api/services';

export const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  // CỜ NGẮN CHẶN BỊ GỌI LẠI 2 LẦN DO REACT STRICT MODE
  const isCalledRef = useRef(false);

  useEffect(() => {
    // Nếu API đã được gọi 1 lần rồi thì dừng, không gọi lại nữa
    if (isCalledRef.current) return;
    isCalledRef.current = true;

    const paramsObj: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      paramsObj[key] = value;
    });

    if (Object.keys(paramsObj).length === 0) {
      setLoading(false);
      setSuccess(false);
      setMessage('Không tìm thấy thông số phản hồi từ cổng thanh toán.');
      return;
    }

    apiService.handleVNPayCallback(paramsObj)
      .then((res) => {
        setSuccess(res.data.success);
        setMessage(res.data.message || (res.data.success ? 'Thanh toán khoản nộp thành công!' : 'Thanh toán thất bại hoặc bị hủy.'));
      })
      .catch((err) => {
        setSuccess(false);
        setMessage(err?.response?.data?.message || 'Có lỗi xảy ra khi xác thực giao dịch với VNPay.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl animate-fade-up">
        {loading ? (
          <div className="py-8 space-y-3">
            <Loader2 size={40} className="text-amber-400 animate-spin mx-auto" />
            <h3 className="text-base font-bold text-white">Đang xác thực giao dịch VNPay...</h3>
            <p className="text-xs text-slate-400">Vui lòng không đóng trình duyệt trong lúc hệ thống xử lý.</p>
          </div>
        ) : (
          <>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border ${
              success 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              {success ? <CheckCircle2 size={36} /> : <XCircle size={36} />}
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">
                {success ? 'Thanh Toán Thành Công!' : 'Thanh Toán Thất Bại'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
            </div>

            <div className="pt-3">
              <button
                onClick={() => navigate('/')}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                Quay về trang chủ <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};