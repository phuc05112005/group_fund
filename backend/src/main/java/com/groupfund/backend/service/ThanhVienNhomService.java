package com.groupfund.backend.service;

import com.groupfund.backend.entity.*;
import com.groupfund.backend.exception.BusinessException;
import com.groupfund.backend.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ThanhVienNhomService {

    private final ThanhVienNhomRepository thanhVienNhomRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final NhomQuyRepository nhomQuyRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public List<ThanhVienNhom> layDanhSachThanhVienNhom(Long maNhom) {
        return thanhVienNhomRepository.findByNhomQuy_MaNhomAndTrangThaiThanhVien(maNhom, "HOAT_DONG");
    }

    public List<ThanhVienNhom> layDanhSachNhomCuaNguoiDung(Long maNguoiDung) {
        return thanhVienNhomRepository.findByNguoiDung_MaNguoiDung(maNguoiDung);
    }

    public ThanhVienNhom getThanhVienById(Long maThanhVienNhom) {
        return thanhVienNhomRepository.findById(maThanhVienNhom)
                .orElseThrow(() -> new BusinessException("Thành viên nhóm ID " + maThanhVienNhom + " không tồn tại"));
    }

    @Transactional
    public ThanhVienNhom themThanhVienVaoNhom(Long maNguoiDung, Long maNhom) {
        if (thanhVienNhomRepository.existsByNguoiDung_MaNguoiDungAndNhomQuy_MaNhom(maNguoiDung, maNhom)) {
            throw new BusinessException("Người dùng đã là thành viên của nhóm này rồi");
        }

        NguoiDung nguoiDung = nguoiDungRepository.findById(maNguoiDung)
                .orElseThrow(() -> new BusinessException("Người dùng không tồn tại"));
        NhomQuy nhomQuy = nhomQuyRepository.findById(maNhom)
                .orElseThrow(() -> new BusinessException("Nhóm quỹ không tồn tại"));

        ThanhVienNhom thanhVien = new ThanhVienNhom();
        thanhVien.setNguoiDung(nguoiDung);
        thanhVien.setNhomQuy(nhomQuy);
        thanhVien.setSoDuCaNhan(BigDecimal.ZERO);
        thanhVien.setSoTienDangGiu(BigDecimal.ZERO);
        thanhVien.setTrangThaiThanhVien("HOAT_DONG");

        return thanhVienNhomRepository.save(thanhVien);
    }

    @Transactional
    public void roiNhom(Long maThanhVienNhom) {
        ThanhVienNhom thanhVien = getThanhVienById(maThanhVienNhom);

        if (thanhVien.getSoTienDangGiu() != null && thanhVien.getSoTienDangGiu().compareTo(BigDecimal.ZERO) > 0) {
            throw new BusinessException("Không thể rời nhóm! Bạn đang giữ " + thanhVien.getSoTienDangGiu()
                    + " VNĐ tiền quỹ. Hãy bàn giao quỹ cho Thủ quỹ khác trước khi rời nhóm.");
        }

        if (thanhVien.getSoDuCaNhan() != null && thanhVien.getSoDuCaNhan().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Không thể rời nhóm! Bạn đang còn nợ quỹ " + thanhVien.getSoDuCaNhan().abs()
                    + " VNĐ. Vui lòng hoàn tất nộp bù tiền nợ trước khi rời nhóm.");
        }

        thanhVien.setTrangThaiThanhVien("DA_ROI_NHOM");
        thanhVienNhomRepository.save(thanhVien);
    }

    @Transactional
    public ThanhVienNhom ganVaiTro(Long maThanhVienNhom, String tenVaiTro) {
        ThanhVienNhom thanhVien = getThanhVienById(maThanhVienNhom);
        String inputRole = tenVaiTro.toUpperCase().trim();

        // 1. Chuẩn hóa tên role: QUAN_TRI hoặc THU_QUY
        String roleTarget = inputRole;
        if ("TRUONG_NHOM".equals(inputRole) || "QUAN_TRI_NHOM".equals(inputRole)) {
            roleTarget = "QUAN_TRI";
        }

        List<String> currentRoles = thanhVien.getDanhSachVaiTro() != null
                ? new ArrayList<>(thanhVien.getDanhSachVaiTro())
                : new ArrayList<>();

        // 2. RÀO CẢN NGHIỆP VỤ: Kiểm tra gỡ THU_QUY khi đang giữ tiền
        boolean isCurrentlyThuQuy = currentRoles.contains("THU_QUY");
        boolean isRemovingThuQuy = "THANH_VIEN".equals(roleTarget)
                || ("THU_QUY".equals(roleTarget) && isCurrentlyThuQuy);

        if (isCurrentlyThuQuy && isRemovingThuQuy) {
            if (thanhVien.getSoTienDangGiu() != null && thanhVien.getSoTienDangGiu().compareTo(BigDecimal.ZERO) > 0) {
                throw new BusinessException("Không thể gỡ vai trò Thủ quỹ do thành viên này vẫn đang giữ "
                        + thanhVien.getSoTienDangGiu() + " VNĐ tiền quỹ. Vui lòng bàn giao hoặc nộp lại toàn bộ tiền trước!");
            }
        }

        List<String> dsVaiTroMoi = new ArrayList<>();

        if ("THANH_VIEN".equals(roleTarget)) {
            // Nếu chọn "THANH_VIEN" -> Xóa sạch các vai trò đặc biệt (QUAN_TRI, THU_QUY)
            dsVaiTroMoi.clear();
        } else {
            // Cơ chế Toggle cho QUAN_TRI và THU_QUY
            if (currentRoles.contains(roleTarget)) {
                currentRoles.remove(roleTarget);
            } else {
                currentRoles.add(roleTarget);
            }
            // Loại bỏ chữ THANH_VIEN nếu có trong list
            currentRoles.remove("THANH_VIEN");
            dsVaiTroMoi = currentRoles;
        }

        // 3. Cập nhật bảng phụ "ThanhVienNhom_VaiTro" (nếu có)
        entityManager.createNativeQuery("DELETE FROM \"ThanhVienNhom_VaiTro\" WHERE \"maThanhVienNhom\" = :id")
                .setParameter("id", maThanhVienNhom)
                .executeUpdate();

        for (String r : dsVaiTroMoi) {
            entityManager.createNativeQuery("INSERT INTO \"ThanhVienNhom_VaiTro\" (\"maThanhVienNhom\", \"tenVaiTro\") VALUES (:id, :role)")
                    .setParameter("id", maThanhVienNhom)
                    .setParameter("role", r)
                    .executeUpdate();
        }

        // 4. Cập nhật bảng "ThanhVienVaiTro" (Chỉ map QUAN_TRI = 1, THU_QUY = 2)
        try {
            entityManager.createNativeQuery("DELETE FROM \"ThanhVienVaiTro\" WHERE \"thanhVienId\" = :id")
                    .setParameter("id", maThanhVienNhom)
                    .executeUpdate();

            for (String r : dsVaiTroMoi) {
                List<?> vtList = entityManager.createNativeQuery(
                                "SELECT \"maVaiTro\" FROM \"VaiTro\" WHERE UPPER(\"tenVaiTro\") = :role")
                        .setParameter("role", r)
                        .getResultList();

                if (!vtList.isEmpty()) {
                    Object vtId = vtList.get(0);
                    entityManager.createNativeQuery("INSERT INTO \"ThanhVienVaiTro\" (\"thanhVienId\", \"vaiTroId\") VALUES (:id, :vtId) ON CONFLICT DO NOTHING")
                            .setParameter("id", maThanhVienNhom)
                            .setParameter("vtId", vtId)
                            .executeUpdate();
                }
            }
        } catch (Exception ignored) {
        }

        entityManager.flush();
        entityManager.clear();

        return getThanhVienById(maThanhVienNhom);
    }
}