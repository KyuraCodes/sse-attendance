package com.ssep.workrecord.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class CreateWorkRecordRequest {

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotNull(message = "Work date is required")
    private LocalDate workDate;

    private String notes;

    public CreateWorkRecordRequest() {}

    public CreateWorkRecordRequest(Long employeeId, LocalDate workDate, String notes) {
        this.employeeId = employeeId;
        this.workDate = workDate;
        this.notes = notes;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public LocalDate getWorkDate() {
        return workDate;
    }

    public void setWorkDate(LocalDate workDate) {
        this.workDate = workDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
