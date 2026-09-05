package com.ecommerce.inventory_service.event;

/**
 * Published to the "stock.events" topic. This is the ORDER LIFECYCLE signal: it tells
 * order-service whether an order's stock was RESERVED or REJECTED, so it can flip the
 * order to CONFIRMED / CANCELLED.
 */
public class StockUpdateEvent {
    private Long orderId;
    private String status; // "RESERVED" | "REJECTED"

    public StockUpdateEvent() {}

    public StockUpdateEvent(Long orderId, String status) {
        this.orderId = orderId;
        this.status = status;
    }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
