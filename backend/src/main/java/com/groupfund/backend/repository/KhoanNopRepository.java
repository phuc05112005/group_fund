package com.groupfund.backend.repository;

import com.groupfund.backend.entity.KhoanNop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KhoanNopRepository extends JpaRepository<KhoanNop, Long> {

    @Query("SELECT DISTINCT kn FROM KhoanNop kn " +
            "LEFT JOIN FETCH kn.nguoiNop tvNop " +
            "LEFT JOIN FETCH tvNop.nguoiDung " +
            "LEFT JOIN FETCH kn.thuQuyNhan tvTQ " +
            "LEFT JOIN FETCH tvTQ.nguoiDung " +
            "WHERE tvNop.nhomQuy.maNhom = :maNhom " +
            "AND (:trangThai IS NULL OR kn.trangThai = :trangThai) " +
            "AND (:thuQuyNhanId IS NULL OR tvTQ.maThanhVienNhom = :thuQuyNhanId) " +
            "ORDER BY kn.maKhoanNop DESC")
    List<KhoanNop> findKhoanNopByNhomAndFilter(
            @Param("maNhom") Long maNhom,
            @Param("trangThai") String trangThai,
            @Param("thuQuyNhanId") Long thuQuyNhanId
    );

    List<KhoanNop> findByNguoiNop_NhomQuy_MaNhom(Long maNhom);

    List<KhoanNop> findByThuQuyNhan_NhomQuy_MaNhom(Long maNhom);
}