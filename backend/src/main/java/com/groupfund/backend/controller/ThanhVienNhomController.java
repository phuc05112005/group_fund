package com.groupfund.backend.controller;

import com.groupfund.backend.entity.ThanhVienNhom;
import com.groupfund.backend.service.ThanhVienNhomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/thanh-vien-nhom")
@RequiredArgsConstructor
public class ThanhVienNhomController {

    private final ThanhVienNhomService thanhVienNhomService;

    @GetMapping("/nhom/{maNhom}")
    public ResponseEntity<List<ThanhVienNhom>> layDanhSachThanhVienNhom(@PathVariable Long maNhom) {
        return ResponseEntity.ok(thanhVienNhomService.layDanhSachThanhVienNhom(maNhom));
    }

    @GetMapping("/nguoi-dung/{maNguoiDung}")
    public ResponseEntity<List<ThanhVienNhom>> layDanhSachNhomCuaNguoiDung(@PathVariable Long maNguoiDung) {
        return ResponseEntity.ok(thanhVienNhomService.layDanhSachNhomCuaNguoiDung(maNguoiDung));
    }

    @GetMapping("/{maThanhVienNhom}")
    public ResponseEntity<ThanhVienNhom> getById(@PathVariable Long maThanhVienNhom) {
        return ResponseEntity.ok(thanhVienNhomService.getThanhVienById(maThanhVienNhom));
    }

    @PostMapping("/them")
    public ResponseEntity<ThanhVienNhom> themThanhVienVaoNhom(@RequestParam Long maNguoiDung,
                                                              @RequestParam Long maNhom) {
        return ResponseEntity.ok(thanhVienNhomService.themThanhVienVaoNhom(maNguoiDung, maNhom));
    }

    @DeleteMapping("/{maThanhVienNhom}/roi-nhom")
    public ResponseEntity<String> roiNhom(@PathVariable Long maThanhVienNhom) {
        thanhVienNhomService.roiNhom(maThanhVienNhom);
        return ResponseEntity.ok("Rời nhóm thành công");
    }
    @PostMapping("/{maThanhVienNhom}/vai-tro")
    public ResponseEntity<ThanhVienNhom> ganVaiTro(
            @PathVariable Long maThanhVienNhom,
            @RequestParam String tenVaiTro) {
        return ResponseEntity.ok(thanhVienNhomService.ganVaiTro(maThanhVienNhom, tenVaiTro));
    }
}