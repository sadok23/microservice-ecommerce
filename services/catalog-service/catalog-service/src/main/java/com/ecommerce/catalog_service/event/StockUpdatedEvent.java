package com.ecommerce.catalog_service.event;

/**
 * Consumed from the "inventory.updated" topic. catalog-service's own copy of the event
 * published by inventory-service; used to refresh the locally cached "inStock" flag on a
 * product WITHOUT a synchronous call to inventory-service on every read.
 */
public class StockUpdatedEvent {
    private Long productId;
    private boolean inStock;

    public StockUpdatedEvent() {}

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public boolean isInStock() { return inStock; }
    public void setInStock(boolean inStock) { this.inStock = inStock; }
}
