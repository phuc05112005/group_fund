package com.groupfund.backend.service;

import com.groupfund.backend.dto.*;

import java.util.List;

public interface QuanLyChiService {
    DeXuatChiResponse taoDeXuatChi(TaoDeXuatChiRequest request);
    List<DeXuatChiResponse> layDanhSachDeXuatByNhom(Long maNhom);
    DeXuatChiResponse bieuQuyetDeXuat(Long maDeXuat, BieuQuyetRequest request);
    DeXuatChiResponse thucHienChiTien(Long maDeXuat);

    ChuyenGiaoQuyResponse taoChuyenGiaoQuy(ChuyenGiaoQuyRequest request);
    List<ChuyenGiaoQuyResponse> layDanhSachChuyenGiaoByNhom(Long maNhom);
}