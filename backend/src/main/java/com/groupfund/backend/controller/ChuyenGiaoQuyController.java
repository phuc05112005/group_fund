package com.groupfund.backend.controller;

import com.groupfund.backend.dto.ChuyenGiaoQuyRequest;
import com.groupfund.backend.entity.ChuyenGiaoQuy;
import com.groupfund.backend.service.ChuyenGiaoQuyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chuyen-giao-quy")
@RequiredArgsConstructor
public class ChuyenGiaoQuyController {

    private final ChuyenGiaoQuyService chuyenGiaoQuyService;

    @GetMapping
    public ResponseEntity<List<ChuyenGiaoQuy>> layDanhSachChuyenGiao() {
        return ResponseEntity.ok(chuyenGiaoQuyService.layDanhSachChuyenGiao());
    }

    @PostMapping
    public ResponseEntity<ChuyenGiaoQuy> taoChuyenGiao(@Valid @RequestBody ChuyenGiaoQuyRequest request) {
        return ResponseEntity.ok(chuyenGiaoQuyService.taoChuyenGiao(request));
    }

    @PutMapping("/{maChuyenGiao}/xac-nhan")
    public ResponseEntity<String> xacNhanChuyenGiao(@PathVariable Long maChuyenGiao,
                                                    @RequestParam Long thuQuyNhanId) {
        chuyenGiaoQuyService.xacNhanChuyenGiao(maChuyenGiao, thuQuyNhanId);
        return ResponseEntity.ok("Xác nhận bàn giao quỹ thành công");
    }
}