package com.groupfund.backend.dto;

import com.groupfund.backend.enums.TrangThaiKhoanNop;
import lombok.Data;

@Data
public class XacNhanKhoanNopRequest {
    private TrangThaiKhoanNop trangThai; // DA_XAC_NHAN hoặc TU_CHOI
    private String lyDoTuChoi;
}