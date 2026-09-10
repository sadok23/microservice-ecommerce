package com.ecommerce.inventory_service.controller;

import com.ecommerce.inventory_service.domain.Stock;
import com.ecommerce.inventory_service.event.StockUpdatedEvent;
import com.ecommerce.inventory_service.repository.StockRepository;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * REST API for managing stock. Protected by the same OAuth2 Resource Server setup as the
 * other services: the gateway validates the JWT at the edge, and the service trusts it.
 * Mutating endpoints are admin-only.
 */
@RestController
@RequestMapping("/api/stock")
public class StockController {

    private static final String INVENTORY_UPDATED_TOPIC = "inventory.updated";

    private final StockRepository repository;
    private final KafkaTemplate<Object, Object> kafkaTemplate;

    public StockController(StockRepository repository, KafkaTemplate<Object, Object> kafkaTemplate) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @GetMapping
    public List<Stock> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public Stock getById(@PathVariable Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Stock not found: " + id));
    }

    @PostMapping
    @PreAuthorize("hasRole('admin')")
    public Stock create(@RequestBody Stock stock) {
        if (stock.getProductId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "productId is required");
        }
        if (stock.getQuantityAvailable() == null || stock.getQuantityAvailable() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "quantityAvailable must be >= 0");
        }
        if (repository.existsByProductId(stock.getProductId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Stock already exists for product " + stock.getProductId());
        }
        return repository.save(stock);
    }

    @PutMapping("/{productId}")
    @PreAuthorize("hasRole('admin')")
    public Stock update(@PathVariable Long productId, @RequestBody Stock stock) {
        if (stock.getQuantityAvailable() == null || stock.getQuantityAvailable() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "quantityAvailable must be >= 0");
        }
        Stock existing = repository.findByProductId(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Stock not found for product " + productId));
        existing.setQuantityAvailable(stock.getQuantityAvailable());
        Stock saved = repository.save(existing);

        // Keep catalog's cached inStock flag in sync (CQRS read-model event).
        publishInventoryUpdated(productId, saved.getQuantityAvailable() > 0);
        return saved;
    }

    @DeleteMapping("/{productId}")
    @PreAuthorize("hasRole('admin')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long productId) {
        Stock existing = repository.findByProductId(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Stock not found for product " + productId));
        repository.delete(existing);
        // If the product no longer has a stock row, it can't be in stock.
        publishInventoryUpdated(productId, false);
    }

    /** Tells catalog-service about the new stock availability (read-model cache sync). */
    private void publishInventoryUpdated(Long productId, boolean inStock) {
        kafkaTemplate.send(INVENTORY_UPDATED_TOPIC, String.valueOf(productId), new StockUpdatedEvent(productId, inStock));
    }
}