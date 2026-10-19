package com.groupfund.backend.repository;

import com.groupfund.backend.entity.LoiMoiThamGia;
import com.groupfund.backend.enums.TrangThaiLoiMoi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoiMoiThamGiaRepository extends JpaRepository<LoiMoiThamGia, Long> {
    List<LoiMoiThamGia> findByNguoiDuocMoi_MaNguoiDungAndTrangThai(Long maNguoiDung, TrangThaiLoiMoi trangThai);
}