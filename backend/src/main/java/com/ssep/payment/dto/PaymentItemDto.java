package com.ssep.payment.dto;

import com.ssep.payment.model.PaymentItem;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PaymentItemDto {

    private Long id;
    private Long paymentId;
    private Long workRecordId;
    private LocalDate workDate;
    private BigDecimal dailyRate;
    private BigDecimal amountApplied;
    private String workRecordStatus;
    private LocalDateTime createdAt;

    public PaymentItemDto() {}

    public static PaymentItemDto fromEntity(PaymentItem item) {
        if (item == null) {
            return null;
        }
        PaymentItemDto dto = new PaymentItemDto();
        dto.setId(item.getId());
        if (item.getPayment() != null) {
            dto.setPaymentId(item.getPayment().getId());
        }
        if (item.getWorkRecord() != null) {
            dto.setWorkRecordId(item.getWorkRecord().getId());
            dto.setWorkDate(item.getWorkRecord().getWorkDate());
            dto.setDailyRate(item.getWorkRecord().getDailyRate());
            dto.setWorkRecordStatus(item.getWorkRecord().getStatus());
        }
        dto.setAmountApplied(item.getAmountApplied());
        dto.setCreatedAt(item.getCreatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Long paymentId) {
        this.paymentId = paymentId;
    }

    public Long getWorkRecordId() {
        return workRecordId;
    }

    public void setWorkRecordId(Long workRecordId) {
        this.workRecordId = workRecordId;
    }

    public LocalDate getWorkDate() {
        return workDate;
    }

    public void setWorkDate(LocalDate workDate) {
        this.workDate = workDate;
    }

    public BigDecimal getDailyRate() {
        return dailyRate;
    }

    public void setDailyRate(BigDecimal dailyRate) {
        this.dailyRate = dailyRate;
    }

    public BigDecimal getAmountApplied() {
        return amountApplied;
    }

    public void setAmountApplied(BigDecimal amountApplied) {
        this.amountApplied = amountApplied;
    }

    public String getWorkRecordStatus() {
        return workRecordStatus;
    }

    public void setWorkRecordStatus(String workRecordStatus) {
        this.workRecordStatus = workRecordStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
