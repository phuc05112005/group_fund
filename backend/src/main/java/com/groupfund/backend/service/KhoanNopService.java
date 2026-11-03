package com.groupfund.backend.service;

import com.groupfund.backend.entity.*;
import com.groupfund.backend.exception.BusinessException;
import com.groupfund.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KhoanNopService {

    private final KhoanNopRepository khoanNopRepository;
    private final ThanhVienNhomRepository thanhVienNhomRepository;
    private final NhomQuyRepository nhomQuyRepository;
    private final ChiTietDeXuatRepository chiTietDeXuatRepository;

    public List<KhoanNop> layDanhSachKhoanNop() {
        return khoanNopRepository.findAll();
    }

    public List<KhoanNop> layDanhSachKhoanNopTheoNhom(Long maNhom, String trangThai, Long thuQuyNhanId) {
        return khoanNopRepository.findKhoanNopByNhomAndFilter(maNhom, trangThai, thuQuyNhanId);
    }

    @Transactional
    public KhoanNop khaiBaoKhoanNop(Long nguoiNopId, Long thuQuyNhanId, BigDecimal soTien,
                                    String noiDung, Long chiTietDeXuatId, String phuongThuc, String minhChung) {
        ThanhVienNhom nguoiNop = thanhVienNhomRepository.findById(nguoiNopId)
                .orElseThrow(() -> new BusinessException("Người nộp không tồn tại"));

        // SỬA: Chỉ tìm Thủ quỹ nếu thuQuyNhanId được truyền lên (khác null)
        ThanhVienNhom thuQuyNhan = null;
        if (thuQuyNhanId != null) {
            thuQuyNhan = thanhVienNhomRepository.findById(thuQuyNhanId)
                    .orElseThrow(() -> new BusinessException("Thủ quỹ nhận không tồn tại"));
        }

        if (soTien == null || soTien.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Số tiền nộp phải lớn hơn 0");
        }

        KhoanNop khoanNop = new KhoanNop();
        khoanNop.setNguoiNop(nguoiNop);
        khoanNop.setThuQuyNhan(thuQuyNhan);
        khoanNop.setSoTien(soTien);
        khoanNop.setNoiDung(noiDung);
        khoanNop.setPhuongThuc(phuongThuc);
        khoanNop.setMinhChung(minhChung);

        if (chiTietDeXuatId != null) {
            ChiTietDeXuat chiTietDeXuat = chiTietDeXuatRepository.findById(chiTietDeXuatId)
                    .orElseThrow(() -> new BusinessException("Chi tiết đề xuất không tồn tại"));
            khoanNop.setChiTietDeXuat(chiTietDeXuat);
        }

        // QUY TẮC AUTO-CONFIRM NỘP: Nếu Người nộp chính là Thủ quỹ nhận
        if (thuQuyNhanId != null && nguoiNopId.equals(thuQuyNhanId)) {
            khoanNop.setTrangThai("DA_XAC_NHAN");
            khoanNop = khoanNopRepository.save(khoanNop);

            capNhatBienDongTaiChinhKhiNop(khoanNop);
        } else {
            khoanNop.setTrangThai("CHO_XAC_NHAN");
            khoanNop = khoanNopRepository.save(khoanNop);
        }

        return khoanNop;
    }

    @Transactional
    public void xacNhanKhoanNop(Long maKhoanNop, String trangThai, Long thuQuyThucHienId) {
        KhoanNop khoanNop = khoanNopRepository.findById(maKhoanNop)
                .orElseThrow(() -> new BusinessException("Khoản nộp không tồn tại"));

        // SỬA: Nếu khoản nộp đã được xác nhận từ trước (VD: do VNPay callback bị gọi trùng), bỏ qua không quăng lỗi
        if ("DA_XAC_NHAN".equalsIgnoreCase(khoanNop.getTrangThai())) {
            return;
        }

        if (!"CHO_XAC_NHAN".equals(khoanNop.getTrangThai())) {
            throw new BusinessException("Khoản nộp này đã được xử lý trước đó");
        }

        if (thuQuyThucHienId != null) {
            // Chặn người nộp tự duyệt khoản nộp của chính mình
            if (khoanNop.getNguoiNop().getMaThanhVienNhom().equals(thuQuyThucHienId)) {
                throw new BusinessException("Bạn không thể tự duyệt khoản nộp do chính mình tạo");
            }

            // SỬA: Kiểm tra đúng Thủ quỹ tiếp nhận (nếu có thủ quỹ)
            if (khoanNop.getThuQuyNhan() != null && !khoanNop.getThuQuyNhan().getMaThanhVienNhom().equals(thuQuyThucHienId)) {
                throw new BusinessException("Chỉ Thủ quỹ tiếp nhận mới có quyền xác nhận khoản nộp này");
            }
        }

        if ("DA_XAC_NHAN".equalsIgnoreCase(trangThai)) {
            khoanNop.setTrangThai("DA_XAC_NHAN");
            khoanNopRepository.save(khoanNop);

            capNhatBienDongTaiChinhKhiNop(khoanNop);
        } else {
            khoanNop.setTrangThai("TU_CHOI");
            khoanNopRepository.save(khoanNop);
        }
    }

    private void capNhatBienDongTaiChinhKhiNop(KhoanNop khoanNop) {
        BigDecimal soTien = khoanNop.getSoTien();

        // Tầng 1: Tổng quỹ nhóm tăng
        NhomQuy nhomQuy = khoanNop.getNguoiNop().getNhomQuy();
        nhomQuy.setSoDuQuy(nhomQuy.getSoDuQuy().add(soTien));
        nhomQuyRepository.save(nhomQuy);

        // Tầng 2: Tiền Thủ quỹ giữ tăng (chỉ cập nhật nếu có thủ quỹ nhận)
        ThanhVienNhom thuQuy = khoanNop.getThuQuyNhan();
        if (thuQuy != null) {
            thuQuy.setSoTienDangGiu(thuQuy.getSoTienDangGiu().add(soTien));
            thanhVienNhomRepository.save(thuQuy);
        }

        // Tầng 3: Số dư cá nhân người nộp tăng
        ThanhVienNhom nguoiNop = khoanNop.getNguoiNop();
        nguoiNop.setSoDuCaNhan(nguoiNop.getSoDuCaNhan().add(soTien));
        thanhVienNhomRepository.save(nguoiNop);
    }
}