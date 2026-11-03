package com.groupfund.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "\"VaiTro\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class VaiTro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "\"maVaiTro\"")
    private Long maVaiTro;

    @Column(name = "\"tenVaiTro\"", nullable = false, unique = true, length = 50)
    private String tenVaiTro;

    @Column(name = "\"moTa\"", columnDefinition = "TEXT")
    private String moTa;
}