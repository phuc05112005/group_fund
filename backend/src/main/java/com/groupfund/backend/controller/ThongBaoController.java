package com.groupfund.backend.controller;

import com.groupfund.backend.entity.NhanThongBao;
import com.groupfund.backend.entity.ThongBao;
import com.groupfund.backend.service.ThongBaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/thong-bao")
@RequiredArgsConstructor
public class ThongBaoController {

    private final ThongBaoService thongBaoService;

    // API cho Header lấy thông báo thật của người dùng đang đăng nhập
    @GetMapping("/me")
    public ResponseEntity<List<NhanThongBao>> layThongBaoCaNhan(@AuthenticationPrincipal Jwt jwt) {
        String keycloakUserId = jwt.getSubject();
        return ResponseEntity.ok(thongBaoService.layThongBaoCuaNguoiDung(keycloakUserId));
    }

    @PostMapping("/nhom/{maNhom}")
    public ResponseEntity<ThongBao> taoThongBaoNhom(@PathVariable Long maNhom,
                                                    @RequestParam String tieuDe,
                                                    @RequestParam String noiDung,
                                                    @RequestParam String loaiThongBao) {
        return ResponseEntity.ok(thongBaoService.taoThongBaoNhom(maNhom, tieuDe, noiDung, loaiThongBao));
    }

    @GetMapping("/thanh-vien/{maThanhVienNhom}")
    public ResponseEntity<List<NhanThongBao>> layDanhSachThongBaoThanhVien(@PathVariable Long maThanhVienNhom) {
        return ResponseEntity.ok(thongBaoService.layDanhSachThongBaoThanhVien(maThanhVienNhom));
    }

    @PutMapping("/danh-dau-da-doc")
    public ResponseEntity<String> danhDauDaDoc(@RequestParam Long maThanhVienNhom,
                                               @RequestParam Long maThongBao) {
        thongBaoService.danhDauDaDoc(maThanhVienNhom, maThongBao);
        return ResponseEntity.ok("Đã đánh dấu đọc thông báo thành công");
    }
}