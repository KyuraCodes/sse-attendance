package com.ssep.payment.controller;

import com.ssep.auth.model.User;
import com.ssep.auth.repository.UserRepository;
import com.ssep.common.dto.ApiResponse;
import com.ssep.payment.dto.CreatePaymentRequest;
import com.ssep.payment.dto.PaymentDto;
import com.ssep.payment.dto.ReceiptDto;
import com.ssep.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final UserRepository userRepository;

    public PaymentController(PaymentService paymentService, UserRepository userRepository) {
        this.paymentService = paymentService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PaymentDto>> createPayment(
            @Valid @RequestBody CreatePaymentRequest request) {
        Long currentUserId = getCurrentUserId();
        PaymentDto created = paymentService.createPayment(request, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Payment created successfully", created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentDto>>> getPayments(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<PaymentDto> payments = paymentService.getPayments(employeeId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(payments));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentDto>> getPaymentById(@PathVariable Long id) {
        PaymentDto payment = paymentService.getPaymentById(id);
        return ResponseEntity.ok(ApiResponse.ok(payment));
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<ApiResponse<ReceiptDto>> getReceipt(@PathVariable Long id) {
        ReceiptDto receipt = paymentService.getReceipt(id);
        return ResponseEntity.ok(ApiResponse.ok(receipt));
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String email = auth.getName();
            if (userRepository != null) {
                return userRepository.findByEmail(email).map(User::getId).orElse(null);
            }
        }
        return null;
    }
}
