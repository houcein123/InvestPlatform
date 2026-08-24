package com.tunisiainvest.platform.payment;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaypalWebhookRepository extends JpaRepository<PaypalWebhook, Long> {

    boolean existsByEventId(String eventId);
}
