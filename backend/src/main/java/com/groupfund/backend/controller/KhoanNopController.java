package com.groupfund.backend.controller;

import com.groupfund.backend.dto.KhoanNopRequest;
import com.groupfund.backend.entity.KhoanNop;
import com.groupfund.backend.service.KhoanNopService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/khoan-nop")
@RequiredArgsConstructor
public class KhoanNopController {

    private final KhoanNopService khoanNopService;

    @GetMapping
    public ResponseEntity<List<KhoanNop>> layDanhSachKhoanNop() {
        return ResponseEntity.ok(khoanNopService.layDanhSachKhoanNop());
    }

    @GetMapping("/nhom-quy/{maNhom}")
    public ResponseEntity<List<KhoanNop>> layDanhSachKhoanNopTheoNhom(
            @PathVariable Long maNhom,
            @RequestParam(required = false) String trangThai,
            @RequestParam(required = false) Long thuQuyNhanId) {
        return ResponseEntity.ok(khoanNopService.layDanhSachKhoanNopTheoNhom(maNhom, trangThai, thuQuyNhanId));
    }

    @PostMapping
    public ResponseEntity<KhoanNop> khaiBaoKhoanNop(@Valid @RequestBody KhoanNopRequest request) {
        return ResponseEntity.ok(khoanNopService.khaiBaoKhoanNop(
                request.getNguoiNopId(),
                request.getThuQuyNhanId(),
                request.getSoTien(),
                request.getNoiDung(),
                request.getChiTietDeXuatId(),
                request.getPhuongThuc(),
                request.getMinhChung()
        ));
    }

    @PutMapping("/{maKhoanNop}/xac-nhan")
    public ResponseEntity<String> xacNhanKhoanNop(
            @PathVariable Long maKhoanNop,
            @RequestParam(required = false, defaultValue = "DA_XAC_NHAN") String trangThai,
            @RequestParam(required = false) Long thuQuyThucHienId) {
        khoanNopService.xacNhanKhoanNop(maKhoanNop, trangThai, thuQuyThucHienId);
        return ResponseEntity.ok("Xác nhận khoản nộp thành công");
    }
}