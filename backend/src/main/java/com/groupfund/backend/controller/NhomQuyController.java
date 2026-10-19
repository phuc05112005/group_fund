package com.groupfund.backend.controller;

import com.groupfund.backend.dto.*;
import com.groupfund.backend.service.NhomQuyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/groups")
public class NhomQuyController {

    private final NhomQuyService nhomQuyService;

    @Autowired
    public NhomQuyController(NhomQuyService nhomQuyService) {
        this.nhomQuyService = nhomQuyService;
    }

    @PostMapping
    public ResponseEntity<NhomQuyResponse> taoNhom(@RequestBody TaoNhomRequest request) {
        return ResponseEntity.ok(nhomQuyService.taoNhom(request));
    }

    @GetMapping("/my-groups")
    public ResponseEntity<List<NhomQuyResponse>> layDanhSachNhomCuaToi() {
        return ResponseEntity.ok(nhomQuyService.layDanhSachNhomCuaToi());
    }

    @GetMapping("/{maNhom}")
    public ResponseEntity<NhomQuyResponse> layChiTietNhom(@PathVariable Long maNhom) {
        return ResponseEntity.ok(nhomQuyService.layChiTietNhom(maNhom));
    }

    @PostMapping("/join")
    public ResponseEntity<NhomQuyResponse> thamGiaBangMaCode(@RequestParam String maThamGia) {
        return ResponseEntity.ok(nhomQuyService.thamGiaBangMaCode(maThamGia));
    }

    @GetMapping("/{maNhom}/members")
    public ResponseEntity<List<ThanhVienResponse>> layDanhSachThanhVien(@PathVariable Long maNhom) {
        return ResponseEntity.ok(nhomQuyService.layDanhSachThanhVien(maNhom));
    }

    // 1. API Gán Đa Vai Trò (Checkbox Multi-Role)
    @PostMapping("/{maNhom}/assign-multi-role")
    public ResponseEntity<String> ganDaVaiTro(
            @PathVariable Long maNhom,
            @RequestBody PhanVaiTroMultiRequest request
    ) {
        nhomQuyService.ganDaVaiTro(maNhom, request);
        return ResponseEntity.ok("Cập nhật vai trò thành công!");
    }

    // 2. API Rời Nhóm Quỹ
    @PostMapping("/{maNhom}/leave")
    public ResponseEntity<String> roiNhomQuy(@PathVariable Long maNhom) {
        nhomQuyService.roiNhomQuy(maNhom);
        return ResponseEntity.ok("Rời nhóm thành công!");
    }
    @PutMapping("/{maNhom}/settings")
    public ResponseEntity<String> capNhatChinhSach(
            @PathVariable Long maNhom,
            @RequestBody CapNhatNhomRequest request
    ) {
        nhomQuyService.capNhatChinhSach(maNhom, request);
        return ResponseEntity.ok("Cập nhật cấu hình thành công!");
    }

    // 3. API Đóng / Xóa Nhóm Quỹ
    @DeleteMapping("/{maNhom}")
    public ResponseEntity<String> dongNhomQuy(@PathVariable Long maNhom) {
        nhomQuyService.dongNhomQuy(maNhom);
        return ResponseEntity.ok("Đóng nhóm thành công!");
    }
}