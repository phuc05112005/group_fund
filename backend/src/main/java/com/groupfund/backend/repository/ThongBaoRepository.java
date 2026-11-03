package com.groupfund.backend.repository;

import com.groupfund.backend.entity.ThongBao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ThongBaoRepository extends JpaRepository<ThongBao, Long> {

    // Lấy danh sách thông báo phát ra trong nhóm theo thứ tự thời gian mới nhất
    List<ThongBao> findByNhomQuy_MaNhomOrderByNgayTaoDesc(Long maNhom);


}