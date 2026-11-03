package com.groupfund.backend.service;

import com.groupfund.backend.config.VNPayProperties;
import com.groupfund.backend.dto.VNPayPaymentRequest;
import com.groupfund.backend.entity.KhoanNop;
import com.groupfund.backend.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;

import java.util.*;

@Service
@RequiredArgsConstructor
public class VNPayService {

    private final VNPayProperties vnPayProperties;
    private final KhoanNopService khoanNopService;

    @Transactional
    public String taoUrlThanhToan(VNPayPaymentRequest request, HttpServletRequest servletRequest) {
        // 1. Khai báo bản ghi KhoanNop chờ xác nhận
        KhoanNop khoanNop = khoanNopService.khaiBaoKhoanNop(
                request.getNguoiNopId(),
                request.getThuQuyNhanId(),
                request.getSoTien(),
                request.getNoiDung() != null ? request.getNoiDung() : "Nop tien quy qua VNPay",
                request.getChiTietDeXuatId(),
                "VNPAY",
                null
        );

        // 2. Xây dựng tham số gửi VNPay
        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String vnp_TxnRef = String.valueOf(khoanNop.getMaKhoanNop());
        String vnp_IpAddr = getIpAddress(servletRequest);
        String vnp_TmnCode = vnPayProperties.getTmnCode();

        long amount = request.getSoTien().longValue() * 100;

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amount));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", "Thanh toan khoan nop ID: " + vnp_TxnRef);
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnPayProperties.getReturnUrl());
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        // 3. Sắp xếp tham số theo alphabet và tạo Chuỗi Hash
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();

        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String queryUrl = query.toString();
        String vnp_SecureHash = hmacSHA512(vnPayProperties.getHashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;

        return vnPayProperties.getPayUrl() + "?" + queryUrl;
    }

    @Transactional
    public boolean xuLyCallback(Map<String, String> queryParams) {
        String vnp_SecureHash = queryParams.get("vnp_SecureHash");
        Map<String, String> fields = new HashMap<>(queryParams);
        fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();

        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }

        String calculatedHash = hmacSHA512(vnPayProperties.getHashSecret(), hashData.toString());

        if (!calculatedHash.equalsIgnoreCase(vnp_SecureHash)) {
            throw new BusinessException("Chữ ký VNPay không hợp lệ (Invalid Checksum)");
        }

        String vnp_ResponseCode = queryParams.get("vnp_ResponseCode");
        Long maKhoanNop = Long.parseLong(queryParams.get("vnp_TxnRef"));

        if ("00".equals(vnp_ResponseCode)) {
            // BỔ SUNG: Bắt exception nếu khoản nộp đã được xử lý trước đó, vẫn coi là thành công
            try {
                khoanNopService.xacNhanKhoanNop(maKhoanNop, "DA_XAC_NHAN", null);
            } catch (Exception e) {
                // Nếu đã xác nhận rồi thì bỏ qua ngoại lệ và trả về thành công
            }
            return true;
        } else {
            // Thanh toán thất bại hoặc hủy bỏ
            try {
                khoanNopService.xacNhanKhoanNop(maKhoanNop, "TU_CHOI", null);
            } catch (Exception e) {
                // Ignore nếu đã xử lý
            }
            return false;
        }
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);
            byte[] result = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new BusinessException("Lỗi tính toán chữ ký mã hóa VNPay");
        }
    }

    private String getIpAddress(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-FORWARDED-FOR");
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = request.getRemoteAddr();
        }
        return ipAddress != null ? ipAddress : "127.0.0.1";
    }
}