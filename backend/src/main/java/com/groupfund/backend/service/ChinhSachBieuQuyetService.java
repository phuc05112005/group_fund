package com.groupfund.backend.service;

import com.groupfund.backend.entity.ChinhSachBieuQuyet;
import com.groupfund.backend.entity.NhomQuy;
import com.groupfund.backend.exception.BusinessException;
import com.groupfund.backend.repository.ChinhSachBieuQuyetRepository;
import com.groupfund.backend.repository.NhomQuyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class ChinhSachBieuQuyetService {

    private final ChinhSachBieuQuyetRepository chinhSachBieuQuyetRepository;
    private final NhomQuyRepository nhomQuyRepository;

    public ChinhSachBieuQuyet layChinhSachTheoNhom(Long maNhom) {
        return chinhSachBieuQuyetRepository.findByNhomQuy_MaNhom(maNhom)
                .orElseThrow(() -> new BusinessException("Chưa cấu hình chính sách biểu quyết cho nhóm ID " + maNhom));
    }

    @Transactional
    public ChinhSachBieuQuyet capNhatChinhSach(Long maNhom, BigDecimal tyLeDongYToiThieu, Integer thoiGianHieuLucHours) {
        ChinhSachBieuQuyet chinhSach = chinhSachBieuQuyetRepository.findByNhomQuy_MaNhom(maNhom)
                .orElseGet(() -> {
                    NhomQuy nhom = nhomQuyRepository.findById(maNhom)
                            .orElseThrow(() -> new BusinessException("Nhóm không tồn tại"));
                    ChinhSachBieuQuyet cs = new ChinhSachBieuQuyet();
                    cs.setNhomQuy(nhom);
                    return cs;
                });

        if (tyLeDongYToiThieu != null) {
            if (tyLeDongYToiThieu.compareTo(BigDecimal.ZERO) < 0 || tyLeDongYToiThieu.compareTo(new BigDecimal("100")) > 0) {
                throw new BusinessException("Tỷ lệ đồng ý phải từ 0% đến 100%");
            }
            chinhSach.setTyLeDongYToiThieu(tyLeDongYToiThieu);
        }

        if (thoiGianHieuLucHours != null && thoiGianHieuLucHours > 0) {
            chinhSach.setThoiGianHieuLucHours(thoiGianHieuLucHours);
        }

        return chinhSachBieuQuyetRepository.save(chinhSach);
    }
}