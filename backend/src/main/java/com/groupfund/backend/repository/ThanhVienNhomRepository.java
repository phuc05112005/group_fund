package com.groupfund.backend.repository;

import com.groupfund.backend.entity.ThanhVienNhom;
import com.groupfund.backend.enums.TrangThaiThanhVien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ThanhVienNhomRepository extends JpaRepository<ThanhVienNhom, Long> {

    Optional<ThanhVienNhom> findByNhomQuy_MaNhomAndNguoiDung_MaNguoiDung(Long maNhom, Long maNguoiDung);

    List<ThanhVienNhom> findByNhomQuy_MaNhomAndTrangThaiThanhVien(Long maNhom, TrangThaiThanhVien trangThai);

    boolean existsByNhomQuy_MaNhomAndNguoiDung_MaNguoiDung(Long maNhom, Long maNguoiDung);
    long countByNhomQuy_MaNhomAndTrangThaiThanhVien(Long maNhom, TrangThaiThanhVien trangThai);
    List<ThanhVienNhom> findByNguoiDung_MaNguoiDung(Long maNguoiDung);
}