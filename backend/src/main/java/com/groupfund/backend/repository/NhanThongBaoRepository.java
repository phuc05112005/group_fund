package com.groupfund.backend.repository;

import com.groupfund.backend.entity.NhanThongBao;
import com.groupfund.backend.entity.NhanThongBaoId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NhanThongBaoRepository extends JpaRepository<NhanThongBao, NhanThongBaoId> {

    /**
     * Lấy danh sách thông báo của một thành viên cụ thể trong 1 nhóm (mới nhất xếp trước)
     */
    List<NhanThongBao> findByThanhVienNhom_MaThanhVienNhomOrderByThongBao_NgayTaoDesc(Long maThanhVienNhom);

    /**
     * Lấy toàn bộ thông báo cá nhân của người dùng trên tất cả các nhóm (mới nhất xếp trước - dùng cho Header)
     */
    List<NhanThongBao> findByThanhVienNhom_NguoiDung_MaNguoiDungOrderByThongBao_NgayTaoDesc(Long maNguoiDung);
}