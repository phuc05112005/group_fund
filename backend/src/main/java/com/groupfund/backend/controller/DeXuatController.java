package com.groupfund.backend.controller;

import com.groupfund.backend.dto.DeXuatRequest;
import com.groupfund.backend.dto.PhieuBieuQuyetRequest;
import com.groupfund.backend.entity.DeXuat;
import com.groupfund.backend.entity.PhieuBieuQuyet;
import com.groupfund.backend.service.DeXuatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class DeXuatController {

    private final DeXuatService deXuatService;

    @GetMapping("/nhom-quy/{maNhom}/de-xuat")
    public ResponseEntity<List<DeXuat>> layDanhSachTheoNhomPath(@PathVariable Long maNhom) {
        return ResponseEntity.ok(deXuatService.layDanhSachDeXuatTheoNhom(maNhom));
    }

    @GetMapping("/de-xuat/nhom/{maNhom}")
    public ResponseEntity<List<DeXuat>> layDanhSachTheoNhom(@PathVariable Long maNhom) {
        return ResponseEntity.ok(deXuatService.layDanhSachDeXuatTheoNhom(maNhom));
    }

    @GetMapping("/de-xuat/{maDeXuat}")
    public ResponseEntity<DeXuat> layChiTiet(@PathVariable Long maDeXuat) {
        return ResponseEntity.ok(deXuatService.layChiTietDeXuat(maDeXuat));
    }

    @PostMapping("/nhom-quy/{maNhom}/de-xuat")
    public ResponseEntity<DeXuat> taoDeXuatTheoNhom(@PathVariable Long maNhom,
                                                    @RequestParam(required = false) Long maThanhVienTao,
                                                    @Valid @RequestBody DeXuatRequest request) {
        if (request.getNhomId() == null) {
            request.setNhomId(maNhom);
        }

        if (maThanhVienTao == null) {
            throw new IllegalArgumentException("Thiếu thông tin ID thành viên tạo đề xuất (maThanhVienTao)!");
        }

        return ResponseEntity.ok(deXuatService.taoDeXuat(maThanhVienTao, request));
    }

    @PostMapping("/de-xuat")
    public ResponseEntity<DeXuat> taoDeXuat(@RequestParam Long maThanhVienTao,
                                            @Valid @RequestBody DeXuatRequest request) {
        return ResponseEntity.ok(deXuatService.taoDeXuat(maThanhVienTao, request));
    }

    @PostMapping("/de-xuat/{maDeXuat}/thu-hoi")
    public ResponseEntity<String> thuHoiDeXuat(@PathVariable Long maDeXuat,
                                               @AuthenticationPrincipal Jwt jwt) {
        String keycloakUserId = jwt.getSubject();
        deXuatService.thuHoiDeXuat(maDeXuat, keycloakUserId);
        return ResponseEntity.ok("Thu hồi đề xuất thành công");
    }

    @PostMapping("/de-xuat/{maDeXuat}/bieu-quyet")
    public ResponseEntity<PhieuBieuQuyet> boPhieuPath(@PathVariable Long maDeXuat,
                                                      @RequestParam Long maThanhVien,
                                                      @Valid @RequestBody PhieuBieuQuyetRequest request) {
        return ResponseEntity.ok(deXuatService.boPhieu(maThanhVien, request));
    }

    @PostMapping("/de-xuat/bo-phieu")
    public ResponseEntity<PhieuBieuQuyet> boPhieu(@RequestParam Long maThanhVien,
                                                  @Valid @RequestBody PhieuBieuQuyetRequest request) {
        return ResponseEntity.ok(deXuatService.boPhieu(maThanhVien, request));
    }
    @PutMapping("/de-xuat/{maDeXuat}/giai-ngan")
    public ResponseEntity<DeXuat> giaiNganDeXuat(
            @PathVariable Long maDeXuat,
            @RequestParam Long thuQuyThucHienId) {
        return ResponseEntity.ok(deXuatService.giaiNganDeXuat(maDeXuat, thuQuyThucHienId));
    }
}