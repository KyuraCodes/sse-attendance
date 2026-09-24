package com.ssep.report.dto;

import java.math.BigDecimal;

public class OutstandingReportDto {

    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private BigDecimal outstandingBalance = BigDecimal.ZERO;
    private int totalWorkDaysUnpaid;
    private BigDecimal storedAmount = BigDecimal.ZERO;
    private int storedCount;

    public OutstandingReportDto() {}

    public OutstandingReportDto(Long employeeId, String employeeCode, String employeeName,
                                BigDecimal outstandingBalance, int totalWorkDaysUnpaid,
                                BigDecimal storedAmount, int storedCount) {
        this.employeeId = employeeId;
        this.employeeCode = employeeCode;
        this.employeeName = employeeName;
        this.outstandingBalance = outstandingBalance != null ? outstandingBalance : BigDecimal.ZERO;
        this.totalWorkDaysUnpaid = totalWorkDaysUnpaid;
        this.storedAmount = storedAmount != null ? storedAmount : BigDecimal.ZERO;
        this.storedCount = storedCount;
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

    public BigDecimal getOutstandingBalance() {
        return outstandingBalance;
    }

    public void setOutstandingBalance(BigDecimal outstandingBalance) {
        this.outstandingBalance = outstandingBalance;
    }

    public BigDecimal getOutstandingAmount() {
        return outstandingBalance;
    }

    public void setOutstandingAmount(BigDecimal outstandingAmount) {
        this.outstandingBalance = outstandingAmount;
    }

    public int getTotalWorkDaysUnpaid() {
        return totalWorkDaysUnpaid;
    }

    public void setTotalWorkDaysUnpaid(int totalWorkDaysUnpaid) {
        this.totalWorkDaysUnpaid = totalWorkDaysUnpaid;
    }

    public int getUnpaidDays() {
        return totalWorkDaysUnpaid;
    }

    public void setUnpaidDays(int unpaidDays) {
        this.totalWorkDaysUnpaid = unpaidDays;
    }

    public BigDecimal getStoredAmount() {
        return storedAmount;
    }

    public void setStoredAmount(BigDecimal storedAmount) {
        this.storedAmount = storedAmount;
    }

    public int getStoredCount() {
        return storedCount;
    }

    public void setStoredCount(int storedCount) {
        this.storedCount = storedCount;
    }

    public int getStoredDays() {
        return storedCount;
    }

    public void setStoredDays(int storedDays) {
        this.storedCount = storedDays;
    }
}
