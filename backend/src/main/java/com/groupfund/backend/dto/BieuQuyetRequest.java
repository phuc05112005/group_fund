package com.groupfund.backend.dto;

import com.groupfund.backend.enums.LuaChonBieuQuyet;
import lombok.Data;

@Data
public class BieuQuyetRequest {
    private LuaChonBieuQuyet luaChon; // DONG_Y hoặc KHONG_DONG_Y
    private String lyDo;
}