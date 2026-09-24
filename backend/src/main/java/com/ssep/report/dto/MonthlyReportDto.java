package com.ssep.report.dto;

import com.ssep.workrecord.dto.WorkRecordDto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class MonthlyReportDto {

    private int year;
    private int month;
    private int totalWorkRecords;
    private BigDecimal grossPayroll = BigDecimal.ZERO;
    private BigDecimal paidAmount = BigDecimal.ZERO;
    private BigDecimal outstandingAmount = BigDecimal.ZERO;
    private List<WorkRecordDto> records = new ArrayList<>();

    public MonthlyReportDto() {}

    public MonthlyReportDto(int year, int month, int totalWorkRecords, BigDecimal grossPayroll,
                            BigDecimal paidAmount, BigDecimal outstandingAmount, List<WorkRecordDto> records) {
        this.year = year;
        this.month = month;
        this.totalWorkRecords = totalWorkRecords;
        this.grossPayroll = grossPayroll != null ? grossPayroll : BigDecimal.ZERO;
        this.paidAmount = paidAmount != null ? paidAmount : BigDecimal.ZERO;
        this.outstandingAmount = outstandingAmount != null ? outstandingAmount : BigDecimal.ZERO;
        this.records = records != null ? records : new ArrayList<>();
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public int getMonth() {
        return month;
    }

    public void setMonth(int month) {
        this.month = month;
    }

    public int getTotalWorkRecords() {
        return totalWorkRecords;
    }

    public void setTotalWorkRecords(int totalWorkRecords) {
        this.totalWorkRecords = totalWorkRecords;
    }

    public BigDecimal getGrossPayroll() {
        return grossPayroll;
    }

    public void setGrossPayroll(BigDecimal grossPayroll) {
        this.grossPayroll = grossPayroll;
    }

    public BigDecimal getPaidAmount() {
        return paidAmount;
    }

    public void setPaidAmount(BigDecimal paidAmount) {
        this.paidAmount = paidAmount;
    }

    public BigDecimal getOutstandingAmount() {
        return outstandingAmount;
    }

    public void setOutstandingAmount(BigDecimal outstandingAmount) {
        this.outstandingAmount = outstandingAmount;
    }

    public List<WorkRecordDto> getRecords() {
        return records;
    }

    public void setRecords(List<WorkRecordDto> records) {
        this.records = records;
    }
}
