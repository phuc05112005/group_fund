package com.groupfund.backend.repository;

import com.groupfund.backend.entity.ChiTietDeXuat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChiTietDeXuatRepository extends JpaRepository<ChiTietDeXuat, Long> {

    // Lấy danh sách chi tiết phân bổ tiền cho từng người theo mã đề xuất
    List<ChiTietDeXuat> findByDeXuat_MaDeXuat(Long maDeXuat);

    // Lấy danh sách phân bổ liên quan đến một thành viên
    List<ChiTietDeXuat> findByThanhVienNhom_MaThanhVienNhom(Long maThanhVienNhom);
}