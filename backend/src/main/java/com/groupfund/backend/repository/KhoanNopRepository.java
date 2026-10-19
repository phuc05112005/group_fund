package com.groupfund.backend.repository;

import com.groupfund.backend.entity.KhoanNop;
import com.groupfund.backend.enums.TrangThaiKhoanNop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KhoanNopRepository extends JpaRepository<KhoanNop, Long> {
    List<KhoanNop> findByNhomQuy_MaNhomAndTrangThai(Long maNhom, TrangThaiKhoanNop trangThai);
    List<KhoanNop> findByNguoiKhaiBao_MaThanhVienNhom(Long maThanhVienNhom);
    long countByNhomQuy_MaNhomAndTrangThai(Long maNhom, TrangThaiKhoanNop trangThai);
    long countByNghiaVuDongGop_MaNghiaVu(Long maNghiaVu);
}