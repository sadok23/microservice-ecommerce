package com.ecommerce.inventory_service.event;

import java.util.List;

/**
 * Consumed from the "order.events" topic. This is inventory-service's OWN copy of the
 * event - it is structurally identical to the class order-service publishes, but lives in
 * this service's package because there is deliberately no shared library between services.
 * (Each service keeps its own copy of the event shapes it cares about.)
 */
public class OrderCreatedEvent {
    private Long orderId;
    private List<OrderItemEvent> items;

    public OrderCreatedEvent() {}

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public List<OrderItemEvent> getItems() { return items; }
    public void setItems(List<OrderItemEvent> items) { this.items = items; }
}
