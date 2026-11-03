package com.groupfund.backend.repository;

import com.groupfund.backend.entity.ThanhVienVaiTro;
import com.groupfund.backend.entity.ThanhVienVaiTroId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ThanhVienVaiTroRepository extends JpaRepository<ThanhVienVaiTro, ThanhVienVaiTroId> {

    // 1. Lấy danh sách vai trò theo ID thành viên nhóm
    List<ThanhVienVaiTro> findById_ThanhVienId(Long thanhVienId);

    // Alias hỗ trợ truy vấn qua quan hệ Entity
    List<ThanhVienVaiTro> findByThanhVienNhom_MaThanhVienNhom(Long maThanhVienNhom);

    // 2. Kiểm tra thành viên có đang giữ một vai trò cụ thể không
    boolean existsById_ThanhVienIdAndVaiTro_TenVaiTro(Long thanhVienId, String tenVaiTro);

    // 3. Gỡ duy nhất một vai trò cụ thể khỏi thành viên
    void deleteById_ThanhVienIdAndVaiTro_TenVaiTro(Long thanhVienId, String tenVaiTro);

    // 4. Xóa TOÀN BỘ vai trò của thành viên (dùng khi thành viên Rời nhóm)
    void deleteById_ThanhVienId(Long thanhVienId);
}