package com.groupfund.backend.repository;

import com.groupfund.backend.entity.KhoanChi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KhoanChiRepository extends JpaRepository<KhoanChi, Long> {

    // Tìm danh sách khoản chi thông qua Thủ quỹ thực hiện thuộc Nhóm Quỹ
    List<KhoanChi> findByThuQuyThucHien_NhomQuy_MaNhom(Long maNhom);
}