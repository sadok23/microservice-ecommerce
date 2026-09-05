package com.ecommerce.inventory_service.controller;

import com.ecommerce.inventory_service.domain.Stock;
import com.ecommerce.inventory_service.repository.StockRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * REST API for managing stock. Protected by the same OAuth2 Resource Server setup as the
 * other services: the gateway validates the JWT at the edge, and the service trusts it.
 */
@RestController
@RequestMapping("/api/stock")
public class StockController {

    private final StockRepository repository;

    public StockController(StockRepository repository) {
        this.repository = repository;
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
}
