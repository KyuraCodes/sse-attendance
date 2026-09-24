package com.ssep.payment.repository;

import com.ssep.payment.model.PaymentItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentItemRepository extends JpaRepository<PaymentItem, Long> {

    @Query("SELECT COALESCE(SUM(pi.amountApplied), 0) FROM PaymentItem pi WHERE pi.workRecord.id = :workRecordId")
    BigDecimal sumAppliedByWorkRecordId(@Param("workRecordId") Long workRecordId);

    List<PaymentItem> findByPaymentId(Long paymentId);

    List<PaymentItem> findByWorkRecordId(Long workRecordId);
}
