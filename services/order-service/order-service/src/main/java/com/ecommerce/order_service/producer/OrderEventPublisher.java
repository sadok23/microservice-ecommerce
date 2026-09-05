package com.ecommerce.order_service.producer;

import com.ecommerce.order_service.domain.OrderItem;
import com.ecommerce.order_service.event.OrderCreatedEvent;
import com.ecommerce.order_service.event.OrderItemEvent;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Thin wrapper around KafkaTemplate that owns the "order.events" topic and the mapping from
 * JPA OrderItem -> event DTO. Keeps the controller free of Kafka concerns.
 *
 * kafkaTemplate.send() is asynchronous (non-blocking): it returns a CompletableFuture and the
 * actual network write happens in the background, so it does not hold up the HTTP response.
 */
@Component
public class OrderEventPublisher {

    private static final String TOPIC = "order.events";

    private final KafkaTemplate<Object, Object> kafkaTemplate;

    public OrderEventPublisher(KafkaTemplate<Object, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishOrderCreated(Long orderId, List<OrderItem> items) {
        List<OrderItemEvent> itemEvents = items.stream()
                .map(i -> new OrderItemEvent(i.getProductId(), i.getQuantity()))
                .toList();
        kafkaTemplate.send(TOPIC, String.valueOf(orderId), new OrderCreatedEvent(orderId, itemEvents));
    }
}
