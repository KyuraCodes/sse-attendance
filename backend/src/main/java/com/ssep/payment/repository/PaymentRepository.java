package com.ssep.payment.repository;

import com.ssep.payment.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long>, JpaSpecificationExecutor<Payment> {

    List<Payment> findByEmployeeIdOrderByPaymentDateDesc(Long employeeId);

    List<Payment> findByEmployeeId(Long employeeId);

    boolean existsByPaymentCode(String paymentCode);

    Optional<Payment> findByPaymentCode(String paymentCode);
}
