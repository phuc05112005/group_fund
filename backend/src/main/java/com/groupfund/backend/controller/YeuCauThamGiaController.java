package com.groupfund.backend.controller;

import com.groupfund.backend.entity.YeuCauThamGia;
import com.groupfund.backend.service.YeuCauThamGiaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/yeu-cau-tham-gia")
@RequiredArgsConstructor
public class YeuCauThamGiaController {

    private final YeuCauThamGiaService yeuCauThamGiaService;

    @GetMapping("/nhom/{maNhom}/cho-duyet")
    public ResponseEntity<List<YeuCauThamGia>> layDanhSachChoDuyet(@PathVariable Long maNhom) {
        return ResponseEntity.ok(yeuCauThamGiaService.layDanhSachChoDuyet(maNhom));
    }

    @PostMapping("/gui-yeu-cau")
    public ResponseEntity<YeuCauThamGia> guiYeuCauThamGia(@RequestParam Long maNguoiDung,
                                                          @RequestParam Long maNhom,
                                                          @RequestParam(required = false) String lyDoNote) {
        return ResponseEntity.ok(yeuCauThamGiaService.guiYeuCauThamGia(maNguoiDung, maNhom, lyDoNote));
    }

    @PutMapping("/{maYeuCau}/xu-ly")
    public ResponseEntity<String> duyetYeuCau(@PathVariable Long maYeuCau,
                                              @RequestParam boolean dongY) {
        yeuCauThamGiaService.duyetYeuCau(maYeuCau, dongY);
        return ResponseEntity.ok(dongY ? "Đã duyệt yêu cầu tham gia thành công" : "Đã từ chối yêu cầu tham gia");
    }
}