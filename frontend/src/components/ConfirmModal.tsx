import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'danger';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Xác nhận hành động',
  message,
  type = 'warning',
  confirmText = 'Đồng ý',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const iconMap = {
    info: <Info className="text-blue-400" size={24} />,
    success: <CheckCircle2 className="text-emerald-400" size={24} />,
    warning: <AlertCircle className="text-amber-400" size={24} />,
    danger: <AlertCircle className="text-rose-400" size={24} />,
  };

  const buttonBgMap = {
    info: 'bg-blue-500 hover:bg-blue-400 text-white',
    success: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
    warning: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    danger: 'bg-rose-500 hover:bg-rose-400 text-white',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative animate-scale-in">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 shrink-0">
            {iconMap[type]}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/80">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition border border-slate-800"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition shadow-md ${buttonBgMap[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};