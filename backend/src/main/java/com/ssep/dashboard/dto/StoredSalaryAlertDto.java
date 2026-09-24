package com.ssep.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class StoredSalaryAlertDto {

    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private int storedCount;
    private BigDecimal totalAmount;
    private LocalDate oldestStoredDate;

    public StoredSalaryAlertDto() {}

    public StoredSalaryAlertDto(Long employeeId, String employeeCode, String employeeName,
                                int storedCount, BigDecimal totalAmount, LocalDate oldestStoredDate) {
        this.employeeId = employeeId;
        this.employeeCode = employeeCode;
        this.employeeName = employeeName;
        this.storedCount = storedCount;
        this.totalAmount = totalAmount;
        this.oldestStoredDate = oldestStoredDate;
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

    public int getStoredCount() {
        return storedCount;
    }

    public void setStoredCount(int storedCount) {
        this.storedCount = storedCount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getTotalStoredAmount() {
        return totalAmount;
    }

    public void setTotalStoredAmount(BigDecimal totalStoredAmount) {
        this.totalAmount = totalStoredAmount;
    }

    public LocalDate getOldestStoredDate() {
        return oldestStoredDate;
    }

    public void setOldestStoredDate(LocalDate oldestStoredDate) {
        this.oldestStoredDate = oldestStoredDate;
    }
}
