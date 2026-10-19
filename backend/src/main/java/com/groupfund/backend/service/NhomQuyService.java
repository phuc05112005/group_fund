package com.groupfund.backend.service;

import com.groupfund.backend.dto.*;

import java.util.List;

public interface NhomQuyService {
    NhomQuyResponse taoNhom(TaoNhomRequest request);
    List<NhomQuyResponse> layDanhSachNhomCuaToi();
    NhomQuyResponse layChiTietNhom(Long maNhom);
    NhomQuyResponse thamGiaBangMaCode(String maThamGia);
    List<ThanhVienResponse> layDanhSachThanhVien(Long maNhom);
    void dongNhomQuy(Long maNhom);
    void roiNhomQuy(Long maNhom);
    void ganDaVaiTro(Long maNhom, PhanVaiTroMultiRequest request);
    void capNhatChinhSach(Long maNhom, CapNhatNhomRequest request);
}