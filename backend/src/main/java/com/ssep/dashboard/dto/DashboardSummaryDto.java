package com.ssep.dashboard.dto;

import com.ssep.payment.dto.PaymentDto;
import com.ssep.workrecord.dto.WorkRecordDto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class DashboardSummaryDto {

    private int activeEmployees;
    private int workingToday;
    private BigDecimal todayPayroll = BigDecimal.ZERO;
    private BigDecimal outstandingSalary = BigDecimal.ZERO;
    private List<StoredSalaryAlertDto> storedSalaryAlerts = new ArrayList<>();
    private List<WorkRecordDto> recentWorkRecords = new ArrayList<>();
    private List<PaymentDto> recentPayments = new ArrayList<>();

    public DashboardSummaryDto() {}

    public DashboardSummaryDto(int activeEmployees, int workingToday, BigDecimal todayPayroll,
                               BigDecimal outstandingSalary, List<StoredSalaryAlertDto> storedSalaryAlerts,
                               List<WorkRecordDto> recentWorkRecords, List<PaymentDto> recentPayments) {
        this.activeEmployees = activeEmployees;
        this.workingToday = workingToday;
        this.todayPayroll = todayPayroll != null ? todayPayroll : BigDecimal.ZERO;
        this.outstandingSalary = outstandingSalary != null ? outstandingSalary : BigDecimal.ZERO;
        this.storedSalaryAlerts = storedSalaryAlerts != null ? storedSalaryAlerts : new ArrayList<>();
        this.recentWorkRecords = recentWorkRecords != null ? recentWorkRecords : new ArrayList<>();
        this.recentPayments = recentPayments != null ? recentPayments : new ArrayList<>();
    }

    public int getActiveEmployees() {
        return activeEmployees;
    }

    public void setActiveEmployees(int activeEmployees) {
        this.activeEmployees = activeEmployees;
    }

    public int getWorkingToday() {
        return workingToday;
    }

    public void setWorkingToday(int workingToday) {
        this.workingToday = workingToday;
    }

    public BigDecimal getTodayPayroll() {
        return todayPayroll;
    }

    public void setTodayPayroll(BigDecimal todayPayroll) {
        this.todayPayroll = todayPayroll;
    }

    public BigDecimal getOutstandingSalary() {
        return outstandingSalary;
    }

    public void setOutstandingSalary(BigDecimal outstandingSalary) {
        this.outstandingSalary = outstandingSalary;
    }

    public List<StoredSalaryAlertDto> getStoredSalaryAlerts() {
        return storedSalaryAlerts;
    }

    public void setStoredSalaryAlerts(List<StoredSalaryAlertDto> storedSalaryAlerts) {
        this.storedSalaryAlerts = storedSalaryAlerts;
    }

    public List<WorkRecordDto> getRecentWorkRecords() {
        return recentWorkRecords;
    }

    public void setRecentWorkRecords(List<WorkRecordDto> recentWorkRecords) {
        this.recentWorkRecords = recentWorkRecords;
    }

    public List<PaymentDto> getRecentPayments() {
        return recentPayments;
    }

    public void setRecentPayments(List<PaymentDto> recentPayments) {
        this.recentPayments = recentPayments;
    }
}
