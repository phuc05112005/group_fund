package com.groupfund.backend.controller;

import com.groupfund.backend.dto.ThanhVienVaiTroRequest;
import com.groupfund.backend.entity.ThanhVienVaiTro;
import com.groupfund.backend.service.VaiTroService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vai-tro")
@RequiredArgsConstructor
public class VaiTroController {

    private final VaiTroService vaiTroService;

    @GetMapping("/thanh-vien/{thanhVienId}")
    public ResponseEntity<List<ThanhVienVaiTro>> layDanhSachVaiTroThanhVien(@PathVariable Long thanhVienId) {
        return ResponseEntity.ok(vaiTroService.layDanhSachVaiTroThanhVien(thanhVienId));
    }

    @PostMapping("/gan")
    public ResponseEntity<String> ganVaiTro(@Valid @RequestBody ThanhVienVaiTroRequest request) {
        vaiTroService.ganVaiTro(request.getThanhVienId(), request.getTenVaiTro());
        return ResponseEntity.ok("Gán vai trò thành công");
    }

    @DeleteMapping("/go")
    public ResponseEntity<String> goVaiTro(@RequestParam Long thanhVienId,
                                           @RequestParam String tenVaiTro) {
        vaiTroService.goVaiTro(thanhVienId, tenVaiTro);
        return ResponseEntity.ok("Gỡ vai trò thành công");
    }
}