package com.ssep.employee.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class UpdateEmployeeRequest {

    @Size(max = 150, message = "Name must not exceed 150 characters")
    private String name;

    @Size(max = 30, message = "Phone must not exceed 30 characters")
    private String phone;

    private String address;

    @DecimalMin(value = "0.01", inclusive = true, message = "Daily rate must be greater than 0")
    private BigDecimal dailyRate;

    private LocalDate startDate;

    private String notes;

    public UpdateEmployeeRequest() {}

    public UpdateEmployeeRequest(String name, String phone, String address, BigDecimal dailyRate,
                                 LocalDate startDate, String notes) {
        this.name = name;
        this.phone = phone;
        this.address = address;
        this.dailyRate = dailyRate;
        this.startDate = startDate;
        this.notes = notes;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public BigDecimal getDailyRate() {
        return dailyRate;
    }

    public void setDailyRate(BigDecimal dailyRate) {
        this.dailyRate = dailyRate;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
