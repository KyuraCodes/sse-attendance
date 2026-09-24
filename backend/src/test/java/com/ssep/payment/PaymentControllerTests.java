package com.ssep.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssep.auth.model.User;
import com.ssep.auth.repository.UserRepository;
import com.ssep.auth.security.JwtAuthenticationFilter;
import com.ssep.auth.security.JwtService;
import com.ssep.common.exception.AppException;
import com.ssep.common.exception.GlobalExceptionHandler;
import com.ssep.payment.controller.PaymentController;
import com.ssep.payment.dto.CreatePaymentRequest;
import com.ssep.payment.dto.PaymentDto;
import com.ssep.payment.dto.PaymentItemDto;
import com.ssep.payment.dto.ReceiptDto;
import com.ssep.payment.service.PaymentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PaymentController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class PaymentControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PaymentService paymentService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    @WithMockUser(username = "admin@example.com")
    void shouldCreatePaymentSuccessfully() throws Exception {
        User user = new User();
        user.setId(10L);
        user.setEmail("admin@example.com");
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(user));

        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setEmployeeId(1L);
        request.setAmount(new BigDecimal("160.00"));
        request.setPaymentMethod("CASH");
        request.setPaymentDate(LocalDate.of(2026, 9, 24));
        request.setReference("REF-123");

        PaymentDto dto = new PaymentDto();
        dto.setId(1L);
        dto.setPaymentCode("PAY-001");
        dto.setEmployeeId(1L);
        dto.setEmployeeName("Ali");
        dto.setAmount(new BigDecimal("160.00"));
        dto.setPaymentMethod("CASH");
        dto.setPaymentDate(LocalDate.of(2026, 9, 24));

        when(paymentService.createPayment(any(CreatePaymentRequest.class), eq(10L))).thenReturn(dto);

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Payment created successfully"))
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.data.paymentCode").value("PAY-001"))
                .andExpect(jsonPath("$.data.amount").value(160.00));
    }

    @Test
    @WithMockUser(username = "admin@example.com")
    void shouldReturnBadRequestWhenPaymentExceedsBalance() throws Exception {
        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setEmployeeId(1L);
        request.setAmount(new BigDecimal("500.00"));
        request.setPaymentMethod("CASH");
        request.setPaymentDate(LocalDate.of(2026, 9, 24));

        when(paymentService.createPayment(any(CreatePaymentRequest.class), any()))
                .thenThrow(new AppException("Payment amount exceeds outstanding balance", "PAYMENT_EXCEEDS_BALANCE", HttpStatus.BAD_REQUEST));

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("PAYMENT_EXCEEDS_BALANCE"));
    }

    @Test
    @WithMockUser
    void shouldGetPaymentsList() throws Exception {
        PaymentDto dto = new PaymentDto();
        dto.setId(1L);
        dto.setPaymentCode("PAY-001");
        dto.setEmployeeId(1L);
        dto.setAmount(new BigDecimal("80.00"));
        dto.setPaymentDate(LocalDate.of(2026, 9, 24));

        when(paymentService.getPayments(eq(1L), any(), any())).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/payments")
                        .param("employeeId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].paymentCode").value("PAY-001"))
                .andExpect(jsonPath("$.data[0].amount").value(80.00));
    }

    @Test
    @WithMockUser
    void shouldGetPaymentById() throws Exception {
        PaymentDto dto = new PaymentDto();
        dto.setId(1L);
        dto.setPaymentCode("PAY-001");
        dto.setEmployeeId(1L);
        dto.setAmount(new BigDecimal("80.00"));

        when(paymentService.getPaymentById(1L)).thenReturn(dto);

        mockMvc.perform(get("/api/payments/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.data.paymentCode").value("PAY-001"));
    }

    @Test
    @WithMockUser
    void shouldGetReceipt() throws Exception {
        ReceiptDto receipt = new ReceiptDto();
        receipt.setCompanyName("Sepakat Sepakat Silaturrahim Enterprise");
        receipt.setPaymentId(1L);
        receipt.setPaymentCode("PAY-001");
        receipt.setEmployeeId(1L);
        receipt.setEmployeeName("Ali");
        receipt.setEmployeeCode("EMP-001");
        receipt.setPaymentDate(LocalDate.of(2026, 9, 24));
        receipt.setPaymentMethod("CASH");
        receipt.setTotalAmount(new BigDecimal("80.00"));
        receipt.setStatus("PAID");

        PaymentItemDto itemDto = new PaymentItemDto();
        itemDto.setWorkRecordId(10L);
        itemDto.setWorkDate(LocalDate.of(2026, 9, 24));
        itemDto.setDailyRate(new BigDecimal("80.00"));
        itemDto.setAmountApplied(new BigDecimal("80.00"));
        receipt.setItems(List.of(itemDto));

        when(paymentService.getReceipt(1L)).thenReturn(receipt);

        mockMvc.perform(get("/api/payments/1/receipt"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.companyName").value("Sepakat Sepakat Silaturrahim Enterprise"))
                .andExpect(jsonPath("$.data.paymentCode").value("PAY-001"))
                .andExpect(jsonPath("$.data.totalAmount").value(80.00))
                .andExpect(jsonPath("$.data.items[0].amountApplied").value(80.00));
    }
}
