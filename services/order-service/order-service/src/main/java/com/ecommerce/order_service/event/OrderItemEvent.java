package com.ecommerce.order_service.event;

/** One line item carried on an OrderCreatedEvent. */
public class OrderItemEvent {
    private Long productId;
    private Integer quantity;

    public OrderItemEvent() {}

    public OrderItemEvent(Long productId, Integer quantity) {
        this.productId = productId;
        this.quantity = quantity;
    }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
