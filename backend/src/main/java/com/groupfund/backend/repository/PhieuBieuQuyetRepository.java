package com.groupfund.backend.repository;

import com.groupfund.backend.entity.PhieuBieuQuyet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PhieuBieuQuyetRepository extends JpaRepository<PhieuBieuQuyet, Long> {

    // Lấy toàn bộ phiếu biểu quyết của một đề xuất
    List<PhieuBieuQuyet> findByDeXuat_MaDeXuat(Long maDeXuat);

    // Tìm phiếu biểu quyết cụ thể của một thành viên trong một đề xuất
    Optional<PhieuBieuQuyet> findByDeXuat_MaDeXuatAndThanhVienNhom_MaThanhVienNhom(Long maDeXuat, Long maThanhVienNhom);

    // Kiểm tra xem thành viên đã bỏ phiếu cho đề xuất này chưa
    boolean existsByDeXuat_MaDeXuatAndThanhVienNhom_MaThanhVienNhom(Long maDeXuat, Long maThanhVienNhom);

    // Đếm số lượng phiếu theo lựa chọn (DONG_Y hoặc TU_CHOI) để tính tỷ lệ phê duyệt
    long countByDeXuat_MaDeXuatAndLuaChon(Long maDeXuat, String luaChon);
}