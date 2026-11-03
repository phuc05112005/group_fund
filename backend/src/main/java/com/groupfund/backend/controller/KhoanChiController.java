package com.groupfund.backend.controller;

import com.groupfund.backend.dto.KhoanChiRequest;
import com.groupfund.backend.entity.KhoanChi;
import com.groupfund.backend.service.KhoanChiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class KhoanChiController {

    private final KhoanChiService khoanChiService;

    @GetMapping("/khoan-chi")
    public ResponseEntity<List<KhoanChi>> layDanhSachKhoanChi() {
        try {
            List<KhoanChi> list = khoanChiService.layDanhSachKhoanChi();
            return ResponseEntity.ok(list != null ? list : Collections.emptyList());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @GetMapping("/khoan-chi/nhom-quy/{maNhom}")
    public ResponseEntity<List<KhoanChi>> layDanhSachKhoanChiTheoNhomDirect(@PathVariable Long maNhom) {
        try {
            List<KhoanChi> list = khoanChiService.layDanhSachKhoanChiTheoNhom(maNhom);
            return ResponseEntity.ok(list != null ? list : Collections.emptyList());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @GetMapping("/nhom-quy/{maNhom}/khoan-chi")
    public ResponseEntity<List<KhoanChi>> layDanhSachKhoanChiTheoNhomPath(@PathVariable Long maNhom) {
        try {
            List<KhoanChi> list = khoanChiService.layDanhSachKhoanChiTheoNhom(maNhom);
            return ResponseEntity.ok(list != null ? list : Collections.emptyList());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @GetMapping("/khoan-chi/nhom/{maNhom}")
    public ResponseEntity<List<KhoanChi>> layDanhSachKhoanChiTheoNhom(@PathVariable Long maNhom) {
        try {
            List<KhoanChi> list = khoanChiService.layDanhSachKhoanChiTheoNhom(maNhom);
            return ResponseEntity.ok(list != null ? list : Collections.emptyList());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @PostMapping("/khoan-chi")
    public ResponseEntity<KhoanChi> taoKhoanChi(@Valid @RequestBody KhoanChiRequest request) {
        return ResponseEntity.ok(khoanChiService.taoKhoanChi(request));
    }

    @PutMapping("/khoan-chi/{maKhoanChi}/xac-nhan")
    public ResponseEntity<String> xacNhanKhoanChi(
            @PathVariable Long maKhoanChi,
            @RequestParam(required = false, defaultValue = "DA_XAC_NHAN") String trangThai,
            @RequestParam(required = false) Long nguoiNhanId) {
        khoanChiService.xacNhanKhoanChi(maKhoanChi, trangThai, nguoiNhanId);
        return ResponseEntity.ok("Xử lý xác nhận khoản chi thành công");
    }
}