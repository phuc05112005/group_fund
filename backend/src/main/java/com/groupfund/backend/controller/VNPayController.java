package com.groupfund.backend.controller;

import com.groupfund.backend.dto.VNPayPaymentRequest;
import com.groupfund.backend.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/vnpay")
@RequiredArgsConstructor
public class VNPayController {

    private final VNPayService vnPayService;

    @PostMapping("/create-payment")
    public ResponseEntity<Map<String, String>> createPayment(
            @Valid @RequestBody VNPayPaymentRequest request,
            HttpServletRequest servletRequest) {
        String paymentUrl = vnPayService.taoUrlThanhToan(request, servletRequest);
        return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl));
    }

    @GetMapping("/callback")
    public ResponseEntity<Map<String, Object>> handleCallback(@RequestParam Map<String, String> queryParams) {
        boolean success = vnPayService.xuLyCallback(queryParams);
        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "Thanh toán khoản nộp thành công" : "Thanh toán thất bại hoặc bị hủy"
        ));
    }
}