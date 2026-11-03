package com.groupfund.backend.repository;

import com.groupfund.backend.entity.DeXuat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeXuatRepository extends JpaRepository<DeXuat, Long> {

    // Lấy danh sách đề xuất thuộc về một nhóm
    List<DeXuat> findByNhomQuy_MaNhom(Long maNhom);

    // Lấy danh sách đề xuất theo trạng thái trong nhóm (ví dụ: CHO_DUYET, DA_THONG_QUA)
    List<DeXuat> findByNhomQuy_MaNhomAndTrangThai(Long maNhom, String trangThai);

    // Lấy các đề xuất do một thành viên cụ thể tạo ra
    List<DeXuat> findByNguoiTao_MaThanhVienNhom(Long maThanhVienNhom);
}