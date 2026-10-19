package com.groupfund.backend.entity.id;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;
import java.io.Serializable;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
public class DeXuatNguoiBieuQuyetId implements Serializable {
    @Column(name = "ma_de_xuat")
    private Long maDeXuat;

    @Column(name = "ma_thanh_vien_nhom")
    private Long maThanhVienNhom;
}