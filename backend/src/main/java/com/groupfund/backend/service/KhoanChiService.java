package com.groupfund.backend.service;

import com.groupfund.backend.dto.KhoanChiRequest;
import com.groupfund.backend.entity.*;
import com.groupfund.backend.exception.BusinessException;
import com.groupfund.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KhoanChiService {

    private final KhoanChiRepository khoanChiRepository;
    private final ChiTietKhoanChiRepository chiTietKhoanChiRepository;
    private final ThanhVienNhomRepository thanhVienNhomRepository;
    private final NhomQuyRepository nhomQuyRepository;
    private final ChiTietDeXuatRepository chiTietDeXuatRepository;
    private final ThongBaoService thongBaoService;

    public List<KhoanChi> layDanhSachKhoanChi() {
        return khoanChiRepository.findAll();
    }

    public List<KhoanChi> layDanhSachKhoanChiTheoNhom(Long maNhom) {
        return khoanChiRepository.findByThuQuyThucHien_NhomQuy_MaNhom(maNhom);
    }

    @Transactional
    public KhoanChi taoKhoanChi(KhoanChiRequest request) {
        // 1. Kiểm tra Nhóm, Thủ quỹ và Người nhận
        NhomQuy nhomQuy = nhomQuyRepository.findById(request.getMaNhom())
                .orElseThrow(() -> new BusinessException("Nhóm quỹ không tồn tại"));

        ThanhVienNhom thuQuy = thanhVienNhomRepository.findById(request.getThuQuyThucHienId())
                .orElseThrow(() -> new BusinessException("Thủ quỹ thực hiện không tồn tại"));

        ThanhVienNhom nguoiNhan = thanhVienNhomRepository.findById(request.getNguoiNhanChiId())
                .orElseThrow(() -> new BusinessException("Người nhận chi không tồn tại"));

        BigDecimal soTienChi = request.getSoTien();

        // 2. KIỂM TRA SỐ TIỀN THỦ QUỸ ĐANG GIỮ (Tiền quỹ đã trừ từ trước khi rút quỹ)
        if (thuQuy.getSoTienDangGiu() == null || thuQuy.getSoTienDangGiu().compareTo(soTienChi) < 0) {
            throw new BusinessException("Số tiền Thủ quỹ đang giữ không đủ để xuất chi! Vui lòng thực hiện Rút quỹ trước.");
        }

        // 3. CHỈ TRỪ SỐ TIỀN THỦ QUỸ ĐANG GIỮ (KHÔNG TRỪ SỐ DƯ QUỸ NHÓM NỮA)
        thuQuy.setSoTienDangGiu(thuQuy.getSoTienDangGiu().subtract(soTienChi));
        thanhVienNhomRepository.save(thuQuy);

        // 4. Tạo bản ghi KhoanChi ở trạng thái CHO_XAC_NHAN
        KhoanChi khoanChi = new KhoanChi();
        khoanChi.setThuQuyThucHien(thuQuy);
        khoanChi.setSoTienTong(soTienChi);
        khoanChi.setLoaiPhanBo(request.getLoaiPhanBo());
        khoanChi.setPhuongThuc(request.getPhuongThuc());
        khoanChi.setMinhChung(request.getMinhChung());
        khoanChi.setNoiDung(request.getNoiDung());
        khoanChi.setNgayChi(LocalDateTime.now());
        khoanChi.setTrangThai("CHO_XAC_NHAN");

        khoanChi = khoanChiRepository.save(khoanChi);

        // 5. Tạo bản ghi ChiTietKhoanChi cho người nhận
        ChiTietKhoanChi chiTiet = new ChiTietKhoanChi();
        chiTiet.setKhoanChi(khoanChi);
        chiTiet.setNguoiNhanChi(nguoiNhan);
        chiTiet.setSoTienTru(soTienChi);
        chiTiet.setTrangThaiXacNhan("CHO_XAC_NHAN");

        if (request.getChiTietDeXuatId() != null) {
            ChiTietDeXuat chiTietDeXuat = chiTietDeXuatRepository.findById(request.getChiTietDeXuatId())
                    .orElse(null);
            chiTiet.setChiTietDeXuat(chiTietDeXuat);
        }

        chiTietKhoanChiRepository.save(chiTiet);

        // 6. Trừ số dư cá nhân các thành viên chịu chi phí theo Cơ chế Phân bổ
        xuLyPhanBoSoDuCaNhan(nhomQuy.getMaNhom(), request, soTienChi);

        // 7. Phát thông báo yêu cầu xác nhận đến Người nhận chi
        thongBaoService.taoThongBaoNhom(
                nhomQuy.getMaNhom(),
                "YÊU CẦU XÁC NHẬN NHẬN TIỀN CHI",
                "Thủ quỹ đã thực hiện khoản chi " + soTienChi + " VNĐ cho " + nguoiNhan.getNguoiDung().getHoTen() + ". Vui lòng xác nhận khi đã nhận được tiền.",
                "BIEN_DONG_SO_DU"
        );

        return khoanChi;
    }

    @Transactional
    public void xacNhanKhoanChi(Long maKhoanChi, String trangThai, Long nguoiNhanId) {
        KhoanChi khoanChi = khoanChiRepository.findById(maKhoanChi)
                .orElseThrow(() -> new BusinessException("Khoản chi không tồn tại"));

        if (!"CHO_XAC_NHAN".equals(khoanChi.getTrangThai())) {
            throw new BusinessException("Khoản chi này đã được xử lý trước đó");
        }

        if ("DA_XAC_NHAN".equalsIgnoreCase(trangThai) || "DA_HOAN_THANH".equalsIgnoreCase(trangThai)) {
            khoanChi.setTrangThai("DA_XAC_NHAN");
            if (khoanChi.getDanhSachChiTiet() != null) {
                for (ChiTietKhoanChi ct : khoanChi.getDanhSachChiTiet()) {
                    ct.setTrangThaiXacNhan("DA_XAC_NHAN");
                    ct.setNgayXacNhan(OffsetDateTime.now());
                }
            }
        } else if ("TU_CHOI".equalsIgnoreCase(trangThai)) {
            khoanChi.setTrangThai("TU_CHOI");
            if (khoanChi.getDanhSachChiTiet() != null) {
                for (ChiTietKhoanChi ct : khoanChi.getDanhSachChiTiet()) {
                    ct.setTrangThaiXacNhan("TU_CHOI");
                }
            }

            // HOÀN TIỀN LẠI VÀO SỐ TIỀN THỦ QUỶ ĐANG GIỮ NẾU KHOẢN CHI BỊ TỪ CHỐI
            BigDecimal soTienChi = khoanChi.getSoTienTong();
            ThanhVienNhom thuQuy = khoanChi.getThuQuyThucHien();

            BigDecimal soTienDangGiu = thuQuy.getSoTienDangGiu() != null ? thuQuy.getSoTienDangGiu() : BigDecimal.ZERO;
            thuQuy.setSoTienDangGiu(soTienDangGiu.add(soTienChi));
            thanhVienNhomRepository.save(thuQuy);
        }

        khoanChiRepository.save(khoanChi);
    }

    private void xuLyPhanBoSoDuCaNhan(Long maNhom, KhoanChiRequest request, BigDecimal soTienChi) {
        String loaiPhanBo = request.getLoaiPhanBo();

        if ("QUY_CHUNG".equalsIgnoreCase(loaiPhanBo)) {
            List<ThanhVienNhom> dsThanhVien = thanhVienNhomRepository.findByNhomQuy_MaNhomAndTrangThaiThanhVien(maNhom, "HOAT_DONG");
            if (!dsThanhVien.isEmpty()) {
                BigDecimal soTienTruMoiNguoi = soTienChi.divide(BigDecimal.valueOf(dsThanhVien.size()), 2, RoundingMode.HALF_UP);
                for (ThanhVienNhom tv : dsThanhVien) {
                    tv.setSoDuCaNhan(tv.getSoDuCaNhan().subtract(soTienTruMoiNguoi));
                }
                thanhVienNhomRepository.saveAll(dsThanhVien);
            }
        } else if ("CHIA_DEU_CHON".equalsIgnoreCase(loaiPhanBo) && request.getDsPhanBo() != null) {
            int count = request.getDsPhanBo().size();
            if (count > 0) {
                BigDecimal soTienTruMoiNguoi = soTienChi.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
                for (KhoanChiRequest.PhanBoCaNhanDto pb : request.getDsPhanBo()) {
                    ThanhVienNhom tv = thanhVienNhomRepository.findById(pb.getThanhVienId()).orElse(null);
                    if (tv != null) {
                        tv.setSoDuCaNhan(tv.getSoDuCaNhan().subtract(soTienTruMoiNguoi));
                        thanhVienNhomRepository.save(tv);
                    }
                }
            }
        } else if ("SO_TIEN_RIENG".equalsIgnoreCase(loaiPhanBo) && request.getDsPhanBo() != null) {
            for (KhoanChiRequest.PhanBoCaNhanDto pb : request.getDsPhanBo()) {
                ThanhVienNhom tv = thanhVienNhomRepository.findById(pb.getThanhVienId()).orElse(null);
                if (tv != null && pb.getSoTienTru() != null) {
                    tv.setSoDuCaNhan(tv.getSoDuCaNhan().subtract(pb.getSoTienTru()));
                    thanhVienNhomRepository.save(tv);
                }
            }
        }
    }
}