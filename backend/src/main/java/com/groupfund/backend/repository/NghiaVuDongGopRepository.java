package com.groupfund.backend.repository;

import com.groupfund.backend.entity.NghiaVuDongGop;
import com.groupfund.backend.enums.TrangThaiNghiaVu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NghiaVuDongGopRepository extends JpaRepository<NghiaVuDongGop, Long> {
    List<NghiaVuDongGop> findByNhomQuy_MaNhomAndTrangThai(Long maNhom, TrangThaiNghiaVu trangThai);
}