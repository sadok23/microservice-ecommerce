package com.ecommerce.order_service.consumer;

import com.ecommerce.order_service.domain.Order;
import com.ecommerce.order_service.event.StockUpdateEvent;
import com.ecommerce.order_service.repository.OrderRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Listens on "stock.events" and finalizes an order based on the inventory outcome:
 *   RESERVED -> CONFIRMED, REJECTED -> CANCELLED.
 *
 * If the order is not found (rare - e.g. a stale event), we just skip it. The order is the
 * source of truth for itself, so there is nothing else to reconcile here.
 */
@Component
public class OrderStatusConsumer {

    private final OrderRepository repository;

    public OrderStatusConsumer(OrderRepository repository) {
        this.repository = repository;
    }

    @KafkaListener(topics = "stock.events")
    public void onStockUpdate(StockUpdateEvent event) {
        repository.findById(event.getOrderId()).ifPresent(order -> {
            order.setStatus("RESERVED".equals(event.getStatus()) ? "CONFIRMED" : "CANCELLED");
            repository.save(order);
        });
    }
}
