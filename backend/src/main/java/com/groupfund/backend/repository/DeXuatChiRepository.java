package com.groupfund.backend.repository;

import com.groupfund.backend.entity.DeXuatChi;
import com.groupfund.backend.enums.TrangThaiDeXuat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeXuatChiRepository extends JpaRepository<DeXuatChi, Long> {
    List<DeXuatChi> findByNhomQuy_MaNhomAndTrangThai(Long maNhom, TrangThaiDeXuat trangThai);
    List<DeXuatChi> findByNhomQuy_MaNhom(Long maNhom);
}