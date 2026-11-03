package com.groupfund.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "\"ChinhSachBieuQuyet\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ChinhSachBieuQuyet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "\"maChinhSach\"")
    private Long maChinhSach;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"nhomId\"", nullable = false, unique = true)
    private NhomQuy nhomQuy;

    @Column(name = "\"tyLeDongYToiThieu\"", precision = 5, scale = 2)
    private BigDecimal tyLeDongYToiThieu = new BigDecimal("50.00");

    @Column(name = "\"thoiGianHieuLucHours\"")
    private Integer thoiGianHieuLucHours = 48;

    @Column(name = "\"soLuongVoteToiThieu\"")
    private Integer soLuongVoteToiThieu = 0;
}