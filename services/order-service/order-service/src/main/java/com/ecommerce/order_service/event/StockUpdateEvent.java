package com.ecommerce.order_service.event;

/**
 * Consumed from the "stock.events" topic (published by inventory-service).
 * Carries the outcome of the stock reservation so order-service can finalize the order.
 */
public class StockUpdateEvent {
    private Long orderId;
    private String status; // "RESERVED" | "REJECTED"

    public StockUpdateEvent() {}

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
