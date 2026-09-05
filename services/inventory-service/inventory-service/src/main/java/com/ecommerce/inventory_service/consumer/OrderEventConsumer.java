package com.ecommerce.inventory_service.consumer;

import com.ecommerce.inventory_service.domain.Stock;
import com.ecommerce.inventory_service.event.OrderCreatedEvent;
import com.ecommerce.inventory_service.event.OrderItemEvent;
import com.ecommerce.inventory_service.event.StockUpdateEvent;
import com.ecommerce.inventory_service.event.StockUpdatedEvent;
import com.ecommerce.inventory_service.repository.StockRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Listens on "order.events". This is where the core business decision happens:
 *   1. First check availability for EVERY item in the order.
 *   2. If any item is short, REJECT the whole order (all-or-nothing).
 *   3. Otherwise decrement each item's stock and RESERVE the order.
 *
 * All-or-nothing matters: an order with 3 line items must not partially consume stock.
 * The whole method runs in one DB transaction (@Transactional) so the decrements are atomic.
 */
@Component
public class OrderEventConsumer {

    private static final String STOCK_EVENTS_TOPIC = "stock.events";
    private static final String INVENTORY_UPDATED_TOPIC = "inventory.updated";

    private final StockRepository stockRepository;
    private final KafkaTemplate<Object, Object> kafkaTemplate;

    public OrderEventConsumer(StockRepository stockRepository, KafkaTemplate<Object, Object> kafkaTemplate) {
        this.stockRepository = stockRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @KafkaListener(topics = "order.events")
    @Transactional
    public void onOrderCreated(OrderCreatedEvent event) {
        // --- Pass 1: availability check (nothing mutated yet) ---
        for (OrderItemEvent item : event.getItems()) {
            Stock stock = stockRepository.findByProductId(item.getProductId()).orElse(null);
            if (stock == null || stock.getQuantityAvailable() < item.getQuantity()) {
                publishOrderStatus(event.getOrderId(), "REJECTED");
                return;
            }
        }

        // --- Pass 2: all available -> decrement + notify catalog ---
        for (OrderItemEvent item : event.getItems()) {
            Stock stock = stockRepository.findByProductId(item.getProductId()).orElseThrow();
            stock.setQuantityAvailable(stock.getQuantityAvailable() - item.getQuantity());
            stockRepository.save(stock);

            publishInventoryUpdated(stock.getProductId(), stock.getQuantityAvailable() > 0);
        }

        publishOrderStatus(event.getOrderId(), "RESERVED");
    }

    /** Tells order-service whether stock was reserved or rejected (order lifecycle). */
    private void publishOrderStatus(Long orderId, String status) {
        kafkaTemplate.send(STOCK_EVENTS_TOPIC, String.valueOf(orderId), new StockUpdateEvent(orderId, status));
    }

    /** Tells catalog-service about the new stock availability (read-model cache sync). */
    private void publishInventoryUpdated(Long productId, boolean inStock) {
        kafkaTemplate.send(INVENTORY_UPDATED_TOPIC, String.valueOf(productId), new StockUpdatedEvent(productId, inStock));
    }
}
