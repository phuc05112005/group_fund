package com.groupfund.backend.entity.id;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhieuBieuQuyetId implements Serializable {

    @Column(name = "ma_de_xuat")
    private Long maDeXuat;

    @Column(name = "ma_thanh_vien_nhom")
    private Long maThanhVienNhom;
}