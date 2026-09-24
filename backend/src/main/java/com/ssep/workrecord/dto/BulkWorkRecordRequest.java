package com.ssep.workrecord.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public class BulkWorkRecordRequest {

    @NotNull(message = "Work date is required")
    private LocalDate workDate;

    @NotEmpty(message = "Employee IDs cannot be empty")
    private List<Long> employeeIds;

    private String notes;

    public BulkWorkRecordRequest() {}

    public BulkWorkRecordRequest(LocalDate workDate, List<Long> employeeIds, String notes) {
        this.workDate = workDate;
        this.employeeIds = employeeIds;
        this.notes = notes;
    }

    public LocalDate getWorkDate() {
        return workDate;
    }

    public void setWorkDate(LocalDate workDate) {
        this.workDate = workDate;
    }

    public List<Long> getEmployeeIds() {
        return employeeIds;
    }

    public void setEmployeeIds(List<Long> employeeIds) {
        this.employeeIds = employeeIds;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
