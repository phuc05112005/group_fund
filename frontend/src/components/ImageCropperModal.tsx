import React, { useState, useRef, useEffect } from 'react';
import { X, Check, RotateCw, RefreshCw, Move, ZoomIn } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  aspectRatio?: number; // 1 cho ảnh vuông (QR)
  title?: string;
  onClose: () => void;
  onCropComplete: (croppedBase64: string) => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  aspectRatio = 1,
  title = 'Chỉnh Sửa Góc Ảnh',
  onClose,
  onCropComplete,
}) => {
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [rotation, setRotation] = useState(0);

  // Trạng thái kéo rê chuột
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Tải hình ảnh khi mở modal
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      setRotation(0);
    };
  }, [imageSrc]);

  // Vẽ hình ảnh lên Canvas dựa theo thao tác Kéo & Lăn chuột
  useEffect(() => {
    if (!isOpen || !imgRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetWidth = 600;
    const targetHeight = targetWidth / aspectRatio;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Xóa nền cũ
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Nền tối
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Di chuyển gốc tọa độ về tâm canvas để xoay & phóng to
    ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    const img = imgRef.current;
    const imgAspect = img.width / img.height;
    let drawW = canvas.width;
    let drawH = canvas.width / imgAspect;

    if (drawH < canvas.height) {
      drawH = canvas.height;
      drawW = canvas.height * imgAspect;
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, [isOpen, zoom, offsetX, offsetY, rotation, aspectRatio]);

  if (!isOpen) return null;

  // Xử lý Lăn Chuột để Thu/Phóng (Zoom)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomStep = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(Math.max(parseFloat((prev + zoomStep).toFixed(2)), 0.5), 5.0));
  };

  // Xử lý Click & Kéo Rê (Drag & Move)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => setIsDragging(false);

  // Xử lý Cảm Ứng Di Động (Touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offsetX,
        y: e.touches[0].clientY - offsetY,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffsetX(e.touches[0].clientX - dragStart.x);
    setOffsetY(e.touches[0].clientY - dragStart.y);
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Xuất ảnh Base64 khi hoàn tất
  const handleSave = () => {
    if (!canvasRef.current) return;
    const base64 = canvasRef.current.toDataURL('image/jpeg', 0.9);
    onCropComplete(base64);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Move size={16} className="text-emerald-400" />
            {title}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        {/* Ghi Chú Hướng Dẫn Nhanh */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-3 py-2 rounded-xl text-[11px] font-medium flex items-center gap-2">
          <ZoomIn size={14} className="text-emerald-400 shrink-0" />
          <span>Lăn con trỏ chuột để <strong>Phóng to / Thu nhỏ</strong> • Nhấp giữ chuột & Kéo để <strong>Di chuyển ảnh</strong>.</span>
        </div>

        {/* Khung Chỉnh Sửa Trực Tiếp */}
        <div
          className="relative flex justify-center bg-slate-950 p-2 rounded-2xl overflow-hidden border border-slate-800 select-none cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="max-w-full h-auto rounded-xl shadow-md border border-slate-800"
          />
        </div>

        {/* Các Tùy Chọn Phụ & Nút Hành Động */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:bg-slate-800 transition">
              <RotateCw size={13} /> Xoay 90°
            </button>
            <button
              type="button"
              onClick={() => { setZoom(1); setOffsetX(0); setOffsetY(0); setRotation(0); }}
              className="p-1.5 text-slate-400 hover:text-white transition"
              title="Đặt lại mặc định">
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1 transition">
              <Check size={15} /> Áp Dụng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};