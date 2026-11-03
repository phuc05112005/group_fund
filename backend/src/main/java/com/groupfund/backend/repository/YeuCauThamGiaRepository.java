package com.groupfund.backend.repository;

import com.groupfund.backend.entity.YeuCauThamGia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface YeuCauThamGiaRepository extends JpaRepository<YeuCauThamGia, Long> {

    // Lấy danh sách yêu cầu gia nhập đang chờ duyệt trong một nhóm
    List<YeuCauThamGia> findByNhomQuy_MaNhomAndTrangThai(Long maNhom, String trangThai);

    // Lấy lịch sử yêu cầu gia nhập của một người dùng
    List<YeuCauThamGia> findByNguoiDung_MaNguoiDung(Long maNguoiDung);

    // Kiểm tra xem người dùng đã có yêu cầu gia nhập đang chờ duyệt ở nhóm này chưa
    boolean existsByNguoiDung_MaNguoiDungAndNhomQuy_MaNhomAndTrangThai(Long maNguoiDung, Long maNhom, String trangThai);
}