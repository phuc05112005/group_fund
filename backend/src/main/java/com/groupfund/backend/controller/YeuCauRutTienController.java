package com.groupfund.backend.controller;

import com.groupfund.backend.dto.YeuCauRutTienRequest;
import com.groupfund.backend.entity.KhoanChi;
import com.groupfund.backend.entity.NguoiDung;
import com.groupfund.backend.entity.NhomQuy;
import com.groupfund.backend.entity.ThanhVienNhom;
import com.groupfund.backend.exception.BusinessException;
import com.groupfund.backend.repository.KhoanChiRepository;
import com.groupfund.backend.repository.NguoiDungRepository;
import com.groupfund.backend.repository.NhomQuyRepository;
import com.groupfund.backend.repository.ThanhVienNhomRepository;
import com.groupfund.backend.service.ThongBaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/yeu-cau-rut-tien")
@RequiredArgsConstructor
public class YeuCauRutTienController {

    private final NhomQuyRepository nhomQuyRepository;
    private final KhoanChiRepository khoanChiRepository;
    private final ThanhVienNhomRepository thanhVienNhomRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final ThongBaoService thongBaoService;

    @PostMapping
    public ResponseEntity<String> taoYeuCauRutTien(@RequestBody YeuCauRutTienRequest request,
                                                   @AuthenticationPrincipal Jwt jwt) {
        if (request.getMaNhom() == null) {
            throw new BusinessException("Mã nhóm không được để trống!");
        }

        // 1. Xác định Người dùng & Thủ quỹ thực hiện từ JWT
        String keycloakUserId = jwt.getSubject();
        NguoiDung nguoiDungThucHien = nguoiDungRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new BusinessException("Người dùng không tồn tại!"));

        NhomQuy nhomQuy = nhomQuyRepository.findById(request.getMaNhom())
                .orElseThrow(() -> new BusinessException("Nhóm quỹ không tồn tại!"));

        ThanhVienNhom thuQuy = thanhVienNhomRepository
                .findByNguoiDung_MaNguoiDungAndNhomQuy_MaNhom(nguoiDungThucHien.getMaNguoiDung(), nhomQuy.getMaNhom())
                .orElseThrow(() -> new BusinessException("Thành viên không thuộc nhóm này!"));

        BigDecimal soDuHienTai = nhomQuy.getSoDuQuy() != null ? nhomQuy.getSoDuQuy() : BigDecimal.ZERO;
        if (request.getSoTien() == null || request.getSoTien().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Số tiền rút phải lớn hơn 0!");
        }

        if (soDuHienTai.compareTo(request.getSoTien()) < 0) {
            throw new BusinessException("Số dư quỹ không đủ để thực hiện rút tiền!");
        }

        // 2. TRỪ SỐ DƯ QUỸ NHÓM (LẦN DUY NHẤT)
        nhomQuy.setSoDuQuy(soDuHienTai.subtract(request.getSoTien()));
        nhomQuyRepository.save(nhomQuy);

        // 3. CỘNG SỐ TIỀN THỦ QUỶ ĐANG GIỮ (TẠM ỨNG CÁ NHÂN)
        BigDecimal soTienDangGiuHienTai = thuQuy.getSoTienDangGiu() != null ? thuQuy.getSoTienDangGiu() : BigDecimal.ZERO;
        thuQuy.setSoTienDangGiu(soTienDangGiuHienTai.add(request.getSoTien()));
        thanhVienNhomRepository.save(thuQuy);

        // 4. TẠO BẢN GHI KHOẢN CHI (Khớp chính xác thuộc tính Entity KhoanChi)
        KhoanChi khoanChi = new KhoanChi();
        khoanChi.setThuQuyThucHien(thuQuy);
        khoanChi.setSoTienTong(request.getSoTien());
        khoanChi.setNoiDung("[RÚT QUỸ VỀ STK] " + (request.getNoiDung() != null ? request.getNoiDung() : "Quyết toán quỹ về tài khoản cá nhân"));
        khoanChi.setPhuongThuc("CHUYEN_KHOAN");
        khoanChi.setTrangThai("DA_XAC_NHAN");
        khoanChi.setLoaiPhanBo("RUT_QUI");
        khoanChi.setNgayChi(LocalDateTime.now());

        khoanChiRepository.save(khoanChi);

        // 5. GỬI THÔNG BÁO TỚI TẤT CẢ THÀNH VIÊN TRONG NHÓM
        try {
            List<ThanhVienNhom> dsThanhVien = thanhVienNhomRepository.findByNhomQuy_MaNhom(nhomQuy.getMaNhom());
            String noiDungThongBao = String.format("%s đã thực hiện rút %,.0f VNĐ từ quỹ nhóm %s về STK (%s - %s). Lý do: %s",
                    nguoiDungThucHien.getHoTen(),
                    request.getSoTien(),
                    nhomQuy.getTenNhom(),
                    request.getTenNganHang(),
                    request.getSoTaiKhoan(),
                    request.getNoiDung());

            for (ThanhVienNhom tv : dsThanhVien) {
                if (thongBaoService != null && tv.getNguoiDung() != null) {
                    thongBaoService.guiThongBao(
                            tv.getNguoiDung().getMaNguoiDung(),
                            "Thông báo rút quỹ nhóm",
                            noiDungThongBao,
                            "RUT_QUI",
                            "/groups/" + nhomQuy.getMaNhom()
                    );
                }
            }
        } catch (Exception ignored) {
            // Tránh đứt luồng chính nếu hệ thống thông báo gặp lỗi nhỏ
        }

        return ResponseEntity.ok("Gửi yêu cầu rút tiền thành công!");
    }
}