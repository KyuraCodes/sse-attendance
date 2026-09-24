package com.ssep.employee.repository;

import com.ssep.employee.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByEmployeeCode(String employeeCode);

    boolean existsByEmployeeCode(String employeeCode);

    List<Employee> findByStatus(String status);

    List<Employee> findByNameContainingIgnoreCaseOrEmployeeCodeContainingIgnoreCase(String name, String employeeCode);
}
