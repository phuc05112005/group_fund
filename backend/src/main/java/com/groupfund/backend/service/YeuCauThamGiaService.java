package com.groupfund.backend.service;

import com.groupfund.backend.entity.*;
import com.groupfund.backend.exception.BusinessException;
import com.groupfund.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class YeuCauThamGiaService {

    private final YeuCauThamGiaRepository yeuCauThamGiaRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final NhomQuyRepository nhomQuyRepository;
    private final ThanhVienNhomService thanhVienNhomService;

    public List<YeuCauThamGia> layDanhSachChoDuyet(Long maNhom) {
        return yeuCauThamGiaRepository.findByNhomQuy_MaNhomAndTrangThai(maNhom, "CHO_DUYET");
    }

    @Transactional
    public YeuCauThamGia guiYeuCauThamGia(Long maNguoiDung, Long maNhom, String lyDoNote) {
        if (yeuCauThamGiaRepository.existsByNguoiDung_MaNguoiDungAndNhomQuy_MaNhomAndTrangThai(maNguoiDung, maNhom, "CHO_DUYET")) {
            throw new BusinessException("Bạn đã gửi yêu cầu gia nhập nhóm này và đang chờ duyệt");
        }

        NguoiDung nguoiDung = nguoiDungRepository.findById(maNguoiDung)
                .orElseThrow(() -> new BusinessException("Người dùng không tồn tại"));
        NhomQuy nhomQuy = nhomQuyRepository.findById(maNhom)
                .orElseThrow(() -> new BusinessException("Nhóm quỹ không tồn tại"));

        YeuCauThamGia yeuCau = new YeuCauThamGia();
        yeuCau.setNguoiDung(nguoiDung);
        yeuCau.setNhomQuy(nhomQuy);
        yeuCau.setLyDoNote(lyDoNote);
        yeuCau.setTrangThai("CHO_DUYET");

        return yeuCauThamGiaRepository.save(yeuCau);
    }

    @Transactional
    public void duyetYeuCau(Long maYeuCau, boolean dongY) {
        YeuCauThamGia yeuCau = yeuCauThamGiaRepository.findById(maYeuCau)
                .orElseThrow(() -> new BusinessException("Yêu cầu tham gia không tồn tại"));

        if (!"CHO_DUYET".equals(yeuCau.getTrangThai())) {
            throw new BusinessException("Yêu cầu này đã được xử lý từ trước");
        }

        if (dongY) {
            yeuCau.setTrangThai("DA_DUYET");
            thanhVienNhomService.themThanhVienVaoNhom(
                    yeuCau.getNguoiDung().getMaNguoiDung(),
                    yeuCau.getNhomQuy().getMaNhom()
            );
        } else {
            yeuCau.setTrangThai("TU_CHOI");
        }

        yeuCauThamGiaRepository.save(yeuCau);
    }
}