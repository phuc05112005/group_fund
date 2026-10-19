package com.groupfund.backend.repository;

import com.groupfund.backend.entity.NhomQuy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NhomQuyRepository extends JpaRepository<NhomQuy, Long> {

    Optional<NhomQuy> findByMaThamGia(String maThamGia);

    @Query("SELECT tv.nhomQuy FROM ThanhVienNhom tv WHERE tv.nguoiDung.maNguoiDung = :maNguoiDung AND (tv.trangThaiThanhVien IS NULL OR tv.trangThaiThanhVien = com.groupfund.backend.enums.TrangThaiThanhVien.HOAT_DONG)")
    List<NhomQuy> findNhomByNguoiDungId(@Param("maNguoiDung") Long maNguoiDung);
}