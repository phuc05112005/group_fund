package com.groupfund.backend.entity;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode
public class ThanhVienVaiTroId implements Serializable {

    private Long thanhVienId;
    private Long vaiTroId;
}