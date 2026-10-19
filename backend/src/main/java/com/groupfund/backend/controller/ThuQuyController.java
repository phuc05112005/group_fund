package com.groupfund.backend.controller;

import com.groupfund.backend.dto.*;
import com.groupfund.backend.service.ThuQuyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/contributions")
@RequiredArgsConstructor
public class ThuQuyController {

    private final ThuQuyService thuQuyService;

    // 1. Thủ quỹ tạo đợt thu quỹ mới
    @PostMapping("/campaigns")
    public ResponseEntity<NghiaVuResponse> taoNghiaVu(@RequestBody TaoNghiaVuRequest request) {
        return ResponseEntity.ok(thuQuyService.taoNghiaVuDongGop(request));
    }

    // 2. Lấy danh sách các đợt thu quỹ của nhóm
    @GetMapping("/campaigns/group/{maNhom}")
    public ResponseEntity<List<NghiaVuResponse>> layNghiaVuByNhom(@PathVariable Long maNhom) {
        return ResponseEntity.ok(thuQuyService.layDanhSachNghiaVuByNhom(maNhom));
    }

    // 3. Thành viên khai báo đã nộp tiền
    @PostMapping("/payments")
    public ResponseEntity<KhoanNopResponse> khaiBaoKhoanNop(@RequestBody KhaiBaoKhoanNopRequest request) {
        return ResponseEntity.ok(thuQuyService.khaiBaoKhoanNop(request));
    }

    // 4. Lấy danh sách khoản nộp chờ duyệt của nhóm
    @GetMapping("/payments/pending/group/{maNhom}")
    public ResponseEntity<List<KhoanNopResponse>> layKhoanNopChoDuyet(@PathVariable Long maNhom) {
        return ResponseEntity.ok(thuQuyService.layKhoanNopChoDuyetByNhom(maNhom));
    }

    // 5. Thủ quỹ Duyệt hoặc Từ chối khoản nộp
    @PutMapping("/payments/{maKhoanNop}/verify")
    public ResponseEntity<KhoanNopResponse> xacNhanKhoanNop(
            @PathVariable Long maKhoanNop,
            @RequestBody XacNhanKhoanNopRequest request) {
        return ResponseEntity.ok(thuQuyService.xacNhanKhoanNop(maKhoanNop, request));
    }
    @DeleteMapping("/campaigns/{maNghiaVu}")
    public ResponseEntity<String> xoaDotThu(@PathVariable Long maNghiaVu) {
        thuQuyService.xoaDotThu(maNghiaVu);
        return ResponseEntity.ok("Xóa đợt thu thành công!");
    }
}