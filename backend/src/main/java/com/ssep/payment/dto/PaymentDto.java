package com.ssep.payment.dto;

import com.ssep.payment.model.Payment;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class PaymentDto {

    private Long id;
    private String paymentCode;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private LocalDate paymentDate;
    private BigDecimal amount;
    private String paymentMethod;
    private String reference;
    private String notes;
    private Long createdBy;
    private LocalDateTime createdAt;
    private List<PaymentItemDto> items = new ArrayList<>();

    public PaymentDto() {}

    public static PaymentDto fromEntity(Payment payment) {
        if (payment == null) {
            return null;
        }
        PaymentDto dto = new PaymentDto();
        dto.setId(payment.getId());
        dto.setPaymentCode(payment.getPaymentCode());
        if (payment.getEmployee() != null) {
            dto.setEmployeeId(payment.getEmployee().getId());
            dto.setEmployeeCode(payment.getEmployee().getEmployeeCode());
            dto.setEmployeeName(payment.getEmployee().getName());
        }
        dto.setPaymentDate(payment.getPaymentDate());
        dto.setAmount(payment.getAmount());
        dto.setPaymentMethod(payment.getPaymentMethod());
        dto.setReference(payment.getReference());
        dto.setNotes(payment.getNotes());
        dto.setCreatedBy(payment.getCreatedBy());
        dto.setCreatedAt(payment.getCreatedAt());
        if (payment.getItems() != null) {
            dto.setItems(payment.getItems().stream()
                    .map(PaymentItemDto::fromEntity)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPaymentCode() {
        return paymentCode;
    }

    public void setPaymentCode(String paymentCode) {
        this.paymentCode = paymentCode;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmployeeCode() {
        return employeeCode;
    }

    public void setEmployeeCode(String employeeCode) {
        this.employeeCode = employeeCode;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<PaymentItemDto> getItems() {
        return items;
    }

    public void setItems(List<PaymentItemDto> items) {
        this.items = items;
    }
}
