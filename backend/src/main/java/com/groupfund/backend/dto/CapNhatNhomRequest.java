package com.groupfund.backend.dto;

import com.groupfund.backend.enums.CheDoRiengTu;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CapNhatNhomRequest {
    private String tenNhom;
    private String moTa;
    private CheDoRiengTu cheDoRiengTu;
    private BigDecimal mucTieuQuy;
    private Boolean batPheDuyet;
    private Boolean batBieuQuyet;
    private Integer thoiHanBieuQuyetGio;
}