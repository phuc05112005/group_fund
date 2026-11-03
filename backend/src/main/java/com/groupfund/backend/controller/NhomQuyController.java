package com.groupfund.backend.controller;

import com.groupfund.backend.dto.ThanhVienGroupDto;
import com.groupfund.backend.entity.ChinhSachBieuQuyet;
import com.groupfund.backend.entity.NguoiDung;
import com.groupfund.backend.entity.NhomQuy;
import com.groupfund.backend.entity.YeuCauThamGia;
import com.groupfund.backend.exception.BusinessException;
import com.groupfund.backend.repository.NguoiDungRepository;
import com.groupfund.backend.service.NhomQuyService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/nhom-quy")
@RequiredArgsConstructor
public class NhomQuyController {

    private final NhomQuyService nhomQuyService;
    private final NguoiDungRepository nguoiDungRepository;

    @GetMapping
    public ResponseEntity<List<NhomQuy>> layDanhSachNhom(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nhomQuyService.layDanhSachNhomCuaNguoiDung(jwt.getSubject()));
    }

    @GetMapping("/{maNhom}")
    public ResponseEntity<NhomQuy> layChiTietNhom(@PathVariable Long maNhom) {
        return ResponseEntity.ok(nhomQuyService.layChiTietNhom(maNhom));
    }

    @GetMapping("/{maNhom}/thanh-vien")
    public ResponseEntity<List<ThanhVienGroupDto>> layDanhSachThanhVien(@PathVariable Long maNhom) {
        return ResponseEntity.ok(nhomQuyService.layDanhSachThanhVien(maNhom));
    }

    @PostMapping("/tao-nhom")
    public ResponseEntity<NhomQuy> taoNhomMoi(@AuthenticationPrincipal Jwt jwt,
                                              @RequestBody TaoNhomRequest request) {
        NguoiDung nguoiDung = nguoiDungRepository.findByKeycloakUserId(jwt.getSubject())
                .orElseThrow(() -> new BusinessException("Người dùng không tồn tại"));

        NhomQuy nhomQuy = nhomQuyService.taoNhomMoi(
                nguoiDung.getMaNguoiDung(),
                request.getTenNhom(),
                request.getMoTa(),
                request.getLoaiTienTe(),
                request.getCheDoRiengTu(),
                request.getMucTieuQuy()
        );
        return ResponseEntity.ok(nhomQuy);
    }

    @PostMapping("/tham-gia")
    public ResponseEntity<String> thamGiaBangMa(@AuthenticationPrincipal Jwt jwt,
                                                @RequestParam String maMoi) {
        return ResponseEntity.ok(nhomQuyService.thamGiaBangMa(maMoi, jwt.getSubject()));
    }

    @GetMapping("/{maNhom}/yeu-cau-tham-gia")
    public ResponseEntity<List<YeuCauThamGia>> layDanhSachYeuCauThamGia(@PathVariable Long maNhom,
                                                                        @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nhomQuyService.layDanhSachYeuCauThamGia(maNhom, jwt.getSubject()));
    }

    @PostMapping("/yeu-cau-tham-gia/{maYeuCau}/duyet")
    public ResponseEntity<String> duyetYeuCauThamGia(@PathVariable Long maYeuCau,
                                                     @RequestParam boolean dongY,
                                                     @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nhomQuyService.duyetYeuCauThamGia(maYeuCau, dongY, jwt.getSubject()));
    }

    @PutMapping("/{maNhom}/dong-nhom")
    public ResponseEntity<String> dongNhom(@PathVariable Long maNhom) {
        nhomQuyService.dongNhom(maNhom);
        return ResponseEntity.ok("Đã đóng nhóm quỹ thành công");
    }

    @PostMapping("/{maNhom}/roi-nhom")
    public ResponseEntity<String> roiNhom(@PathVariable Long maNhom,
                                          @AuthenticationPrincipal Jwt jwt) {
        nhomQuyService.roiNhom(maNhom, jwt.getSubject());
        return ResponseEntity.ok("Đã rời khỏi nhóm quỹ thành công");
    }

    @PutMapping("/{maNhom}")
    public ResponseEntity<NhomQuy> capNhatNhom(@PathVariable Long maNhom,
                                               @RequestBody CapNhatNhomRequest request) {
        return ResponseEntity.ok(nhomQuyService.capNhatNhom(
                maNhom, request.getTenNhom(), request.getMoTa(), request.getCheDoRiengTu(), request.getMucTieuQuy()
        ));
    }

    @GetMapping("/{maNhom}/chinh-sach")
    public ResponseEntity<ChinhSachBieuQuyet> layChinhSachBieuQuyet(@PathVariable Long maNhom) {
        return ResponseEntity.ok(nhomQuyService.layChinhSachBieuQuyet(maNhom));
    }

    @PutMapping("/{maNhom}/chinh-sach")
    public ResponseEntity<ChinhSachBieuQuyet> capNhatChinhSachBieuQuyet(@PathVariable Long maNhom,
                                                                        @RequestBody CapNhatChinhSachRequest request) {
        return ResponseEntity.ok(nhomQuyService.capNhatChinhSachBieuQuyet(
                maNhom, request.getTyLeDongYToiThieu(), request.getThoiGianHieuLucHours()
        ));
    }

    @Data
    public static class CapNhatNhomRequest {
        private String tenNhom;
        private String moTa;
        private String cheDoRiengTu;
        private BigDecimal mucTieuQuy;
    }

    @Data
    public static class CapNhatChinhSachRequest {
        private BigDecimal tyLeDongYToiThieu;
        private Integer thoiGianHieuLucHours;
    }

    @Data
    public static class TaoNhomRequest {
        private String tenNhom;
        private String moTa;
        private String loaiTienTe;
        private String cheDoRiengTu;
        private BigDecimal mucTieuQuy;
    }
}