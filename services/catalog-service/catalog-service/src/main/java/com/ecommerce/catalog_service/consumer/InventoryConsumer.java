package com.ecommerce.catalog_service.consumer;

import com.ecommerce.catalog_service.domain.Product;
import com.ecommerce.catalog_service.event.StockUpdatedEvent;
import com.ecommerce.catalog_service.repository.ProductRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * The read side of the CQRS pattern. catalog-service does NOT query inventory-service on
 * every GET /api/products read - instead it keeps a local cached "inStock" flag per product
 * and updates it whenever an "inventory.updated" event arrives. Reads stay fast and fully
 * local; consistency with the true stock level is EVENTUAL (a short window may pass between
 * inventory changing and catalog reflecting it).
 *
 * If the product isn't found we skip silently - a stock event for an unknown product id is
 * harmless and catalog should not fail over a stale event.
 */
@Component
public class InventoryConsumer {

    private final ProductRepository repository;

    public InventoryConsumer(ProductRepository repository) {
        this.repository = repository;
    }

    @KafkaListener(topics = "inventory.updated")
    public void onStockUpdated(StockUpdatedEvent event) {
        repository.findById(event.getProductId()).ifPresent(product -> {
            product.setInStock(event.isInStock());
            repository.save(product);
        });
    }
}
