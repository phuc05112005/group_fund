package com.groupfund.backend.service;

import com.groupfund.backend.dto.ChuyenGiaoQuyRequest;
import com.groupfund.backend.entity.ChuyenGiaoQuy;
import com.groupfund.backend.entity.ThanhVienNhom;
import com.groupfund.backend.exception.BusinessException;
import com.groupfund.backend.repository.ChuyenGiaoQuyRepository;
import com.groupfund.backend.repository.ThanhVienNhomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChuyenGiaoQuyService {

    private final ChuyenGiaoQuyRepository chuyenGiaoQuyRepository;
    private final ThanhVienNhomRepository thanhVienNhomRepository;

    public List<ChuyenGiaoQuy> layDanhSachChuyenGiao() {
        return chuyenGiaoQuyRepository.findAll();
    }

    @Transactional
    public ChuyenGiaoQuy taoChuyenGiao(ChuyenGiaoQuyRequest request) {
        if (request.getThuQuyGuiId().equals(request.getThuQuyNhanId())) {
            throw new BusinessException("Thủ quỹ nhận bàn giao phải khác Thủ quỹ gửi");
        }

        ThanhVienNhom thuQuyGui = thanhVienNhomRepository.findById(request.getThuQuyGuiId())
                .orElseThrow(() -> new BusinessException("Thủ quỹ gửi không tồn tại"));

        ThanhVienNhom thuQuyNhan = thanhVienNhomRepository.findById(request.getThuQuyNhanId())
                .orElseThrow(() -> new BusinessException("Thủ quỹ nhận không tồn tại"));

        if (thuQuyGui.getSoTienDangGiu().compareTo(request.getSoTien()) < 0) {
            throw new BusinessException("Số tiền Thủ quỹ gửi đang giữ không đủ để bàn giao");
        }

        ChuyenGiaoQuy chuyenGiao = new ChuyenGiaoQuy();
        chuyenGiao.setThuQuyGui(thuQuyGui);
        chuyenGiao.setThuQuyNhan(thuQuyNhan);
        chuyenGiao.setSoTien(request.getSoTien());
        chuyenGiao.setPhuongThuc(request.getPhuongThuc());
        chuyenGiao.setMinhChung(request.getMinhChung());
        chuyenGiao.setTrangThai("CHO_XAC_NHAN");

        return chuyenGiaoQuyRepository.save(chuyenGiao);
    }

    @Transactional
    public void xacNhanChuyenGiao(Long maChuyenGiao, Long thuQuyNhanId) {
        ChuyenGiaoQuy chuyenGiao = chuyenGiaoQuyRepository.findById(maChuyenGiao)
                .orElseThrow(() -> new BusinessException("Giao dịch bàn giao không tồn tại"));

        if (!chuyenGiao.getThuQuyNhan().getMaThanhVienNhom().equals(thuQuyNhanId)) {
            throw new BusinessException("Chỉ Thủ quỹ nhận mới có quyền xác nhận giao dịch bàn giao này");
        }

        if (!"CHO_XAC_NHAN".equals(chuyenGiao.getTrangThai())) {
            throw new BusinessException("Giao dịch này đã được xử lý trước đó");
        }

        chuyenGiao.setTrangThai("DA_XAC_NHAN");
        chuyenGiaoQuyRepository.save(chuyenGiao);

        // Cập nhật Tầng 2: Trừ tiền Thủ quỹ gửi, cộng tiền Thủ quỹ nhận (Tầng 1 Tổng quỹ nhóm KHÔNG ĐỔI)
        BigDecimal soTien = chuyenGiao.getSoTien();
        ThanhVienNhom thuQuyGui = chuyenGiao.getThuQuyGui();
        ThanhVienNhom thuQuyNhan = chuyenGiao.getThuQuyNhan();

        thuQuyGui.setSoTienDangGiu(thuQuyGui.getSoTienDangGiu().subtract(soTien));
        thuQuyNhan.setSoTienDangGiu(thuQuyNhan.getSoTienDangGiu().add(soTien));

        thanhVienNhomRepository.save(thuQuyGui);
        thanhVienNhomRepository.save(thuQuyNhan);
    }
}