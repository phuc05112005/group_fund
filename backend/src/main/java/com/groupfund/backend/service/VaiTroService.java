package com.groupfund.backend.service;

import com.groupfund.backend.entity.*;
import com.groupfund.backend.exception.BusinessException;
import com.groupfund.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VaiTroService {

    private final ThanhVienNhomRepository thanhVienNhomRepository;
    private final VaiTroRepository vaiTroRepository;
    private final ThanhVienVaiTroRepository thanhVienVaiTroRepository;

    public List<ThanhVienVaiTro> layDanhSachVaiTroThanhVien(Long thanhVienId) {
        return thanhVienVaiTroRepository.findById_ThanhVienId(thanhVienId);
    }

    @Transactional
    public void ganVaiTro(Long thanhVienId, String tenVaiTro) {
        ThanhVienNhom thanhVien = thanhVienNhomRepository.findById(thanhVienId)
                .orElseThrow(() -> new BusinessException("Thành viên nhóm không tồn tại"));

        VaiTro vaiTro = vaiTroRepository.findByTenVaiTro(tenVaiTro)
                .orElseThrow(() -> new BusinessException("Vai trò " + tenVaiTro + " chưa được định nghĩa"));

        if (thanhVienVaiTroRepository.existsById_ThanhVienIdAndVaiTro_TenVaiTro(thanhVienId, tenVaiTro)) {
            throw new BusinessException("Thành viên đã sở hữu vai trò này từ trước");
        }

        ThanhVienVaiTro thanhVienVaiTro = new ThanhVienVaiTro();
        thanhVienVaiTro.setId(new ThanhVienVaiTroId(thanhVienId, vaiTro.getMaVaiTro()));
        thanhVienVaiTro.setThanhVienNhom(thanhVien);
        thanhVienVaiTro.setVaiTro(vaiTro);

        thanhVienVaiTroRepository.save(thanhVienVaiTro);
    }

    @Transactional
    public void goVaiTro(Long thanhVienId, String tenVaiTro) {
        ThanhVienNhom thanhVien = thanhVienNhomRepository.findById(thanhVienId)
                .orElseThrow(() -> new BusinessException("Thành viên nhóm không tồn tại"));

        // RÀNG BUỘC AN TOÀN (SAFEGUARD): Nếu gỡ vai trò Thủ quỹ, số tiền đang giữ phải bằng 0đ
        if ("THU_QUY".equalsIgnoreCase(tenVaiTro)) {
            if (thanhVien.getSoTienDangGiu() != null && thanhVien.getSoTienDangGiu().compareTo(BigDecimal.ZERO) > 0) {
                throw new BusinessException("Không thể gỡ vai trò Thủ quỹ vì thành viên này đang giữ "
                        + thanhVien.getSoTienDangGiu() + " VNĐ tiền quỹ. Vui lòng chuyển giao quỹ trước khi gỡ!");
            }
        }

        if (!thanhVienVaiTroRepository.existsById_ThanhVienIdAndVaiTro_TenVaiTro(thanhVienId, tenVaiTro)) {
            throw new BusinessException("Thành viên không giữ vai trò này");
        }

        thanhVienVaiTroRepository.deleteById_ThanhVienIdAndVaiTro_TenVaiTro(thanhVienId, tenVaiTro);
    }
}