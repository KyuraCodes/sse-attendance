package com.ssep.workrecord.repository;

import com.ssep.workrecord.model.WorkRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WorkRecordRepository extends JpaRepository<WorkRecord, Long>, JpaSpecificationExecutor<WorkRecord> {

    boolean existsByEmployeeIdAndWorkDate(Long employeeId, LocalDate workDate);

    Optional<WorkRecord> findByEmployeeIdAndWorkDate(Long employeeId, LocalDate workDate);

    List<WorkRecord> findByWorkDate(LocalDate date);

    List<WorkRecord> findByEmployeeId(Long employeeId);

    List<WorkRecord> findByEmployeeIdAndStatusInOrderByWorkDateAsc(Long employeeId, List<String> statuses);

    @Query("SELECT w FROM WorkRecord w WHERE w.employee.id = :employeeId AND w.status IN ('UNPAID', 'STORED', 'PARTIALLY_PAID') ORDER BY w.workDate ASC")
    List<WorkRecord> findUnpaidAndStoredByEmployeeId(@Param("employeeId") Long employeeId);
}
