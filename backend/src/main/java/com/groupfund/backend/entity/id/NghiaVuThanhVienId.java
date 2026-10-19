package com.groupfund.backend.entity.id;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;
import java.io.Serializable;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
public class NghiaVuThanhVienId implements Serializable {
    @Column(name = "ma_nghia_vu")
    private Long maNghiaVu;

    @Column(name = "ma_thanh_vien_nhom")
    private Long maThanhVienNhom;
}