package com.ssep.report.dto;

import com.ssep.workrecord.dto.WorkRecordDto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class EmployeeReportDto {

    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private LocalDate fromDate;
    private LocalDate toDate;
    private BigDecimal totalEarned = BigDecimal.ZERO;
    private BigDecimal totalPaid = BigDecimal.ZERO;
    private BigDecimal remainingBalance = BigDecimal.ZERO;
    private List<WorkRecordDto> records = new ArrayList<>();

    public EmployeeReportDto() {}

    public EmployeeReportDto(Long employeeId, String employeeCode, String employeeName,
                             LocalDate fromDate, LocalDate toDate, BigDecimal totalEarned,
                             BigDecimal totalPaid, BigDecimal remainingBalance, List<WorkRecordDto> records) {
        this.employeeId = employeeId;
        this.employeeCode = employeeCode;
        this.employeeName = employeeName;
        this.fromDate = fromDate;
        this.toDate = toDate;
        this.totalEarned = totalEarned != null ? totalEarned : BigDecimal.ZERO;
        this.totalPaid = totalPaid != null ? totalPaid : BigDecimal.ZERO;
        this.remainingBalance = remainingBalance != null ? remainingBalance : BigDecimal.ZERO;
        this.records = records != null ? records : new ArrayList<>();
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

    public LocalDate getFromDate() {
        return fromDate;
    }

    public void setFromDate(LocalDate fromDate) {
        this.fromDate = fromDate;
    }

    public LocalDate getFrom() {
        return fromDate;
    }

    public void setFrom(LocalDate from) {
        this.fromDate = from;
    }

    public LocalDate getToDate() {
        return toDate;
    }

    public void setToDate(LocalDate toDate) {
        this.toDate = toDate;
    }

    public LocalDate getTo() {
        return toDate;
    }

    public void setTo(LocalDate to) {
        this.toDate = to;
    }

    public BigDecimal getTotalEarned() {
        return totalEarned;
    }

    public void setTotalEarned(BigDecimal totalEarned) {
        this.totalEarned = totalEarned;
    }

    public BigDecimal getTotalPaid() {
        return totalPaid;
    }

    public void setTotalPaid(BigDecimal totalPaid) {
        this.totalPaid = totalPaid;
    }

    public BigDecimal getRemainingBalance() {
        return remainingBalance;
    }

    public void setRemainingBalance(BigDecimal remainingBalance) {
        this.remainingBalance = remainingBalance;
    }

    public BigDecimal getBalance() {
        return remainingBalance;
    }

    public void setBalance(BigDecimal balance) {
        this.remainingBalance = balance;
    }

    public List<WorkRecordDto> getRecords() {
        return records;
    }

    public void setRecords(List<WorkRecordDto> records) {
        this.records = records;
    }

    public List<WorkRecordDto> getWorkRecords() {
        return records;
    }

    public void setWorkRecords(List<WorkRecordDto> workRecords) {
        this.records = workRecords;
    }
}
