package com.groupfund.backend.service;

import com.groupfund.backend.dto.DeXuatRequest;
import com.groupfund.backend.dto.PhieuBieuQuyetRequest;
import com.groupfund.backend.entity.*;
import com.groupfund.backend.exception.BusinessException;
import com.groupfund.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeXuatService {

    private final DeXuatRepository deXuatRepository;
    private final ChiTietDeXuatRepository chiTietDeXuatRepository;
    private final PhieuBieuQuyetRepository phieuBieuQuyetRepository;
    private final NhomQuyRepository nhomQuyRepository;
    private final ThanhVienNhomRepository thanhVienNhomRepository;
    private final ThongBaoService thongBaoService;

    public List<DeXuat> layDanhSachDeXuatTheoNhom(Long maNhom) {
        return deXuatRepository.findByNhomQuy_MaNhom(maNhom);
    }

    public DeXuat layChiTietDeXuat(Long maDeXuat) {
        return deXuatRepository.findById(maDeXuat)
                .orElseThrow(() -> new BusinessException("Đề xuất ID " + maDeXuat + " không tồn tại"));
    }

    @Transactional
    public DeXuat taoDeXuat(Long maThanhVienTao, DeXuatRequest request) {
        ThanhVienNhom nguoiTao = thanhVienNhomRepository.findById(maThanhVienTao)
                .orElseThrow(() -> new BusinessException("Thành viên tạo không tồn tại"));

        NhomQuy nhomQuy = nhomQuyRepository.findById(request.getNhomId())
                .orElseThrow(() -> new BusinessException("Nhóm quỹ không tồn tại"));

        DeXuat deXuat = new DeXuat();
        deXuat.setNhomQuy(nhomQuy);
        deXuat.setNguoiTao(nguoiTao);
        deXuat.setTieuDe(request.getTieuDe());
        deXuat.setMucDich(request.getMucDich());
        deXuat.setLoaiDeXuat(request.getLoaiDeXuat());
        deXuat.setKieuPhanBo(request.getKieuPhanBo());
        deXuat.setSoTienTong(request.getSoTienTong());
        deXuat.setCoBieuQuyet(request.getCoBieuQuyet() != null ? request.getCoBieuQuyet() : true);

        // [BỔ SUNG] Lưu cấu hình ẩn danh & hạn biểu quyết
        deXuat.setIsAnonymous(request.getIsAnonymous() != null ? request.getIsAnonymous() : false);
        deXuat.setHanBieuQuyet(request.getHanBieuQuyet());

        if (Boolean.FALSE.equals(deXuat.getCoBieuQuyet())) {
            deXuat.setTrangThai("DA_THONG_QUA");
        } else {
            deXuat.setTrangThai("CHO_DUYET");
        }

        deXuat = deXuatRepository.save(deXuat);

        if (request.getChiTietItems() != null && !request.getChiTietItems().isEmpty()) {
            for (DeXuatRequest.ChiTietDeXuatItem item : request.getChiTietItems()) {
                ThanhVienNhom tvNhan = thanhVienNhomRepository.findById(item.getThanhVienId())
                        .orElseThrow(() -> new BusinessException("Thành viên phân bổ ID " + item.getThanhVienId() + " không tồn tại"));

                ChiTietDeXuat chiTiet = new ChiTietDeXuat();
                chiTiet.setDeXuat(deXuat);
                chiTiet.setThanhVienNhom(tvNhan);
                chiTiet.setSoTienPhanBo(item.getSoTienPhanBo());
                chiTiet.setGhiChu(item.getGhiChu());
                chiTietDeXuatRepository.save(chiTiet);
            }
        }

        return deXuat;
    }

    @Transactional
    public PhieuBieuQuyet boPhieu(Long maThanhVien, PhieuBieuQuyetRequest request) {
        DeXuat deXuat = layChiTietDeXuat(request.getDeXuatId());

        if (!"CHO_DUYET".equals(deXuat.getTrangThai())) {
            throw new BusinessException("Đề xuất này đã đóng hoặc đã thông qua/từ chối/hủy");
        }

        // [BỔ SUNG] Kiểm tra hạn biểu quyết
        if (deXuat.getHanBieuQuyet() != null && OffsetDateTime.now().isAfter(deXuat.getHanBieuQuyet())) {
            throw new BusinessException("Đã quá thời hạn biểu quyết cho đề xuất này!");
        }

        ThanhVienNhom thanhVien = thanhVienNhomRepository.findById(maThanhVien)
                .orElseThrow(() -> new BusinessException("Thành viên biểu quyết không tồn tại"));

        if (phieuBieuQuyetRepository.existsByDeXuat_MaDeXuatAndThanhVienNhom_MaThanhVienNhom(request.getDeXuatId(), maThanhVien)) {
            throw new BusinessException("Bạn đã biểu quyết cho đề xuất này rồi");
        }

        PhieuBieuQuyet phieu = new PhieuBieuQuyet();
        phieu.setDeXuat(deXuat);
        phieu.setThanhVienNhom(thanhVien);
        phieu.setLuaChon(request.getLuaChon());
        phieu = phieuBieuQuyetRepository.save(phieu);

        kiemTraThongQuaDeXuat(deXuat);

        return phieu;
    }

    private void kiemTraThongQuaDeXuat(DeXuat deXuat) {
        Long nhomId = deXuat.getNhomQuy().getMaNhom();
        List<ThanhVienNhom> dsThanhVien = thanhVienNhomRepository.findByNhomQuy_MaNhomAndTrangThaiThanhVien(nhomId, "HOAT_DONG");
        int tongSoThanhVien = dsThanhVien.size();

        if (tongSoThanhVien == 0) return;

        long soPhieuDongY = phieuBieuQuyetRepository.countByDeXuat_MaDeXuatAndLuaChon(deXuat.getMaDeXuat(), "DONG_Y");

        BigDecimal tyLeHienTai = BigDecimal.valueOf(soPhieuDongY)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(tongSoThanhVien), 2, RoundingMode.HALF_UP);

        // Đặt tỷ lệ đồng ý tối thiểu mặc định 50% (khỏi cần cấu hình quản trị nhóm)
        BigDecimal tyLeYeuCau = new BigDecimal("50.00");

        if (tyLeHienTai.compareTo(tyLeYeuCau) >= 0) {
            deXuat.setTrangThai("DA_THONG_QUA");
            deXuatRepository.save(deXuat);
        }
    }

    @Transactional
    public DeXuat giaiNganDeXuat(Long maDeXuat, Long thuQuyThucHienId) {
        DeXuat deXuat = layChiTietDeXuat(maDeXuat);

        if (!"DA_THONG_QUA".equals(deXuat.getTrangThai())) {
            throw new BusinessException("Đề xuất phải ở trạng thái ĐÃ THÔNG QUA mới có thể giải ngân!");
        }

        ThanhVienNhom thuQuy = thanhVienNhomRepository.findById(thuQuyThucHienId)
                .orElseThrow(() -> new BusinessException("Thành viên thực hiện không tồn tại"));

        BigDecimal soTienChi = deXuat.getSoTienTong();

        if (thuQuy.getSoTienDangGiu() == null || thuQuy.getSoTienDangGiu().compareTo(soTienChi) < 0) {
            throw new BusinessException("Số tiền bạn đang giữ không đủ để thực hiện giải ngân khoản này!");
        }

        NhomQuy nhomQuy = deXuat.getNhomQuy();
        if (nhomQuy.getSoDuQuy().compareTo(soTienChi) < 0) {
            throw new BusinessException("Số dư quỹ nhóm không đủ để giải ngân đề xuất này!");
        }
        nhomQuy.setSoDuQuy(nhomQuy.getSoDuQuy().subtract(soTienChi));
        nhomQuyRepository.save(nhomQuy);

        thuQuy.setSoTienDangGiu(thuQuy.getSoTienDangGiu().subtract(soTienChi));
        thanhVienNhomRepository.save(thuQuy);

        deXuat.setTrangThai("DA_GIAI_NGAN");
        deXuatRepository.save(deXuat);

        thongBaoService.taoThongBaoNhom(
                nhomQuy.getMaNhom(),
                "GIẢI NGÂN ĐỀ XUẤT THÀNH CÔNG",
                "Đề xuất '" + deXuat.getTieuDe() + "' với số tiền " + soTienChi + " VNĐ đã được giải ngân thành công.",
                "DE_XUAT_GIAG_NGAN"
        );

        return deXuat;
    }

    @Transactional
    public void thuHoiDeXuat(Long maDeXuat, String keycloakUserId) {
        DeXuat deXuat = layChiTietDeXuat(maDeXuat);

        if (!deXuat.getNguoiTao().getNguoiDung().getKeycloakUserId().equals(keycloakUserId)) {
            throw new BusinessException("Bạn không có quyền thu hồi đề xuất này (Chỉ người tạo mới có quyền)");
        }

        if ("TU_CHOI".equals(deXuat.getTrangThai()) || "DA_GIAI_NGAN".equals(deXuat.getTrangThai())) {
            throw new BusinessException("Không thể thu hồi đề xuất đã giải ngân hoặc bị từ chối");
        }

        deXuat.setTrangThai("HUY");
        deXuatRepository.save(deXuat);

        thongBaoService.taoThongBaoNhom(
                deXuat.getNhomQuy().getMaNhom(),
                "THU HỒI ĐỀ XUẤT",
                "Đề xuất '" + deXuat.getTieuDe() + "' đã được thu hồi bởi người tạo.",
                "DE_XUAT_THU_HOI"
        );
    }
}