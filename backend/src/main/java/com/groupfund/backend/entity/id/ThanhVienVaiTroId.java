package com.groupfund.backend.entity.id;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;
import java.io.Serializable;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
public class ThanhVienVaiTroId implements Serializable {
    @Column(name = "ma_thanh_vien_nhom")
    private Long maThanhVienNhom;

    @Column(name = "ma_vai_tro")
    private Long maVaiTro;
}