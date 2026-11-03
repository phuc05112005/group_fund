package com.groupfund.backend.repository;

import com.groupfund.backend.entity.ThanhVienNhom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ThanhVienNhomRepository extends JpaRepository<ThanhVienNhom, Long> {

    /**
     * Lấy danh sách các nhóm mà một người dùng tham gia
     */
    List<ThanhVienNhom> findByNguoiDung_MaNguoiDung(Long maNguoiDung);

    /**
     * Kiểm tra người dùng đã tham gia nhóm hay chưa (Thứ tự: NguoiDung, NhomQuy)
     */
    boolean existsByNguoiDung_MaNguoiDungAndNhomQuy_MaNhom(Long maNguoiDung, Long maNhom);

    /**
     * Kiểm tra người dùng đã tham gia nhóm hay chưa (Thứ tự: NhomQuy, NguoiDung)
     */
    boolean existsByNhomQuy_MaNhomAndNguoiDung_MaNguoiDung(Long maNhom, Long maNguoiDung);

    /**
     * Lấy thông tin thành viên nhóm (Thứ tự tham số: maNguoiDung, maNhom) - Dùng cho roiNhom trong NhomQuyService
     */
    Optional<ThanhVienNhom> findByNguoiDung_MaNguoiDungAndNhomQuy_MaNhom(Long maNguoiDung, Long maNhom);

    /**
     * Lấy thông tin thành viên nhóm (Thứ tự tham số: maNhom, maNguoiDung)
     */
    Optional<ThanhVienNhom> findByNhomQuy_MaNhomAndNguoiDung_MaNguoiDung(Long maNhom, Long maNguoiDung);

    /**
     * Lấy danh sách thành viên trong nhóm theo trạng thái (Dùng cho ThongBaoService)
     */
    List<ThanhVienNhom> findByNhomQuy_MaNhomAndTrangThaiThanhVien(Long maNhom, String trangThaiThanhVien);

    /**
     * Lấy tất cả thành viên thuộc một nhóm
     */
    List<ThanhVienNhom> findByNhomQuy_MaNhom(Long maNhom);
}