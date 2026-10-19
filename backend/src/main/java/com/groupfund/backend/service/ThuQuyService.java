package com.groupfund.backend.service;

import com.groupfund.backend.dto.*;

import java.util.List;

public interface ThuQuyService {
    NghiaVuResponse taoNghiaVuDongGop(TaoNghiaVuRequest request);
    List<NghiaVuResponse> layDanhSachNghiaVuByNhom(Long maNhom);

    KhoanNopResponse khaiBaoKhoanNop(KhaiBaoKhoanNopRequest request);
    List<KhoanNopResponse> layKhoanNopChoDuyetByNhom(Long maNhom);
    KhoanNopResponse xacNhanKhoanNop(Long maKhoanNop, XacNhanKhoanNopRequest request);
    void xoaDotThu(Long maNghiaVu);
}