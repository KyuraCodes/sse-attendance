package com.ssep.workrecord.dto;

import com.ssep.workrecord.model.WorkRecord;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class WorkRecordDto {

    private Long id;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private LocalDate workDate;
    private BigDecimal dailyRate;
    private BigDecimal amount;
    private String status;
    private String notes;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public WorkRecordDto() {}

    public WorkRecordDto(Long id, Long employeeId, String employeeCode, String employeeName,
                         LocalDate workDate, BigDecimal dailyRate, BigDecimal amount,
                         String status, String notes, Long createdBy,
                         LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.employeeId = employeeId;
        this.employeeCode = employeeCode;
        this.employeeName = employeeName;
        this.workDate = workDate;
        this.dailyRate = dailyRate;
        this.amount = amount;
        this.status = status;
        this.notes = notes;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static WorkRecordDto fromEntity(WorkRecord wr) {
        if (wr == null) {
            return null;
        }
        WorkRecordDto dto = new WorkRecordDto();
        dto.setId(wr.getId());
        if (wr.getEmployee() != null) {
            dto.setEmployeeId(wr.getEmployee().getId());
            dto.setEmployeeCode(wr.getEmployee().getEmployeeCode());
            dto.setEmployeeName(wr.getEmployee().getName());
        }
        dto.setWorkDate(wr.getWorkDate());
        dto.setDailyRate(wr.getDailyRate());
        dto.setAmount(wr.getAmount());
        dto.setStatus(wr.getStatus());
        dto.setNotes(wr.getNotes());
        dto.setCreatedBy(wr.getCreatedBy());
        dto.setCreatedAt(wr.getCreatedAt());
        dto.setUpdatedAt(wr.getUpdatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
