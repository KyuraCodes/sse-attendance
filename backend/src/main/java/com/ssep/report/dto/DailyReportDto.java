package com.ssep.report.dto;

import com.ssep.workrecord.dto.WorkRecordDto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class DailyReportDto {

    private LocalDate date;
    private int totalRecords;
    private BigDecimal totalAmount = BigDecimal.ZERO;
    private List<WorkRecordDto> records = new ArrayList<>();

    public DailyReportDto() {}

    public DailyReportDto(LocalDate date, int totalRecords, BigDecimal totalAmount, List<WorkRecordDto> records) {
        this.date = date;
        this.totalRecords = totalRecords;
        this.totalAmount = totalAmount != null ? totalAmount : BigDecimal.ZERO;
        this.records = records != null ? records : new ArrayList<>();
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public int getTotalRecords() {
        return totalRecords;
    }

    public void setTotalRecords(int totalRecords) {
        this.totalRecords = totalRecords;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getTotal() {
        return totalAmount;
    }

    public void setTotal(BigDecimal total) {
        this.totalAmount = total;
    }

    public List<WorkRecordDto> getRecords() {
        return records;
    }

    public void setRecords(List<WorkRecordDto> records) {
        this.records = records;
    }
}
