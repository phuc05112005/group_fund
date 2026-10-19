package com.groupfund.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "VAI_TRO")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VaiTro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_vai_tro")
    private Long maVaiTro;

    @Column(name = "ten_vai_tro", nullable = false, unique = true, length = 50)
    private String tenVaiTro;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;
}