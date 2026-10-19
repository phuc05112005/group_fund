package com.groupfund.backend.controller;

import com.groupfund.backend.dto.*;
import com.groupfund.backend.service.QuanLyChiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/expenditures")
@RequiredArgsConstructor
public class QuanLyChiController {

    private final QuanLyChiService quanLyChiService;

    // 1. Tạo đề xuất chi tiền
    @PostMapping("/proposals")
    public ResponseEntity<DeXuatChiResponse> taoDeXuatChi(@RequestBody TaoDeXuatChiRequest request) {
        return ResponseEntity.ok(quanLyChiService.taoDeXuatChi(request));
    }

    // 2a. Lấy danh sách đề xuất chi của nhóm qua PathVariable
    @GetMapping("/proposals/group/{maNhom}")
    public ResponseEntity<List<DeXuatChiResponse>> layDeXuatByNhom(@PathVariable Long maNhom) {
        return ResponseEntity.ok(quanLyChiService.layDanhSachDeXuatByNhom(maNhom));
    }

    // 2b. Lấy danh sách đề xuất chi của nhóm qua QueryParam (Tương thích với Frontend /proposals?maNhom=...)
    @GetMapping("/proposals")
    public ResponseEntity<List<DeXuatChiResponse>> layDeXuatByNhomQuery(@RequestParam Long maNhom) {
        return ResponseEntity.ok(quanLyChiService.layDanhSachDeXuatByNhom(maNhom));
    }

    // 3. Biểu quyết cho một đề xuất
    @PostMapping("/proposals/{maDeXuat}/vote")
    public ResponseEntity<DeXuatChiResponse> bieuQuyet(
            @PathVariable Long maDeXuat,
            @RequestBody BieuQuyetRequest request) {
        return ResponseEntity.ok(quanLyChiService.bieuQuyetDeXuat(maDeXuat, request));
    }

    // 4. Thủ quỹ thực hiện giải ngân chi tiền
    @PostMapping("/proposals/{maDeXuat}/execute")
    public ResponseEntity<DeXuatChiResponse> thucHienChi(@PathVariable Long maDeXuat) {
        return ResponseEntity.ok(quanLyChiService.thucHienChiTien(maDeXuat));
    }

    // 5. Bàn giao quỹ cho Thủ quỹ mới
    @PostMapping("/handovers")
    public ResponseEntity<ChuyenGiaoQuyResponse> taoChuyenGiao(@RequestBody ChuyenGiaoQuyRequest request) {
        return ResponseEntity.ok(quanLyChiService.taoChuyenGiaoQuy(request));
    }

    // 6. Lịch sử bàn giao quỹ của nhóm
    @GetMapping("/handovers/group/{maNhom}")
    public ResponseEntity<List<ChuyenGiaoQuyResponse>> layChuyenGiaoByNhom(@PathVariable Long maNhom) {
        return ResponseEntity.ok(quanLyChiService.layDanhSachChuyenGiaoByNhom(maNhom));
    }
}