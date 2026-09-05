package com.ecommerce.inventory_service.event;

/**
 * Published to the "inventory.updated" topic. This is the READ-MODEL SYNC signal: it tells
 * catalog-service that a product's stock availability changed, so catalog can update its
 * locally cached "inStock" flag WITHOUT calling inventory-service synchronously on every read.
 * This is the CQRS-style event-sourced cache pattern.
 */
public class StockUpdatedEvent {
    private Long productId;
    private boolean inStock;

    public StockUpdatedEvent() {}

    public StockUpdatedEvent(Long productId, boolean inStock) {
        this.productId = productId;
        this.inStock = inStock;
    }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public boolean isInStock() { return inStock; }
    public void setInStock(boolean inStock) { this.inStock = inStock; }
}
