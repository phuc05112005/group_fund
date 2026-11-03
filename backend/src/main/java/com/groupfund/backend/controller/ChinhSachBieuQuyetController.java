package com.groupfund.backend.controller;

import com.groupfund.backend.entity.ChinhSachBieuQuyet;
import com.groupfund.backend.service.ChinhSachBieuQuyetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/chinh-sach-bieu-quyet")
@RequiredArgsConstructor
public class ChinhSachBieuQuyetController {

    private final ChinhSachBieuQuyetService chinhSachBieuQuyetService;

    @GetMapping("/nhom/{maNhom}")
    public ResponseEntity<ChinhSachBieuQuyet> layChinhSachTheoNhom(@PathVariable Long maNhom) {
        return ResponseEntity.ok(chinhSachBieuQuyetService.layChinhSachTheoNhom(maNhom));
    }

    @PutMapping("/nhom/{maNhom}")
    public ResponseEntity<ChinhSachBieuQuyet> capNhatChinhSach(@PathVariable Long maNhom,
                                                               @RequestParam(required = false) BigDecimal tyLeDongYToiThieu,
                                                               @RequestParam(required = false) Integer thoiGianHieuLucHours) {
        return ResponseEntity.ok(chinhSachBieuQuyetService.capNhatChinhSach(maNhom, tyLeDongYToiThieu, thoiGianHieuLucHours));
    }
}