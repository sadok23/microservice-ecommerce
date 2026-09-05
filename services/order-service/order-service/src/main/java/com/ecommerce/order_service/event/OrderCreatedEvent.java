package com.ecommerce.order_service.event;

import java.util.List;

/**
 * Published to the "order.events" topic whenever an order is created. order-service's own
 * copy of the event; inventory-service keeps a structurally identical copy in ITS package.
 */
public class OrderCreatedEvent {
    private Long orderId;
    private List<OrderItemEvent> items;

    public OrderCreatedEvent() {}

    public OrderCreatedEvent(Long orderId, List<OrderItemEvent> items) {
        this.orderId = orderId;
        this.items = items;
    }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public List<OrderItemEvent> getItems() { return items; }
    public void setItems(List<OrderItemEvent> items) { this.items = items; }
}
