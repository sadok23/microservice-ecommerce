package com.ecommerce.order_service.controller;

import com.ecommerce.order_service.client.CatalogClient;
import com.ecommerce.order_service.client.ProductResponse;
import com.ecommerce.order_service.domain.Order;
import com.ecommerce.order_service.domain.OrderItem;
import com.ecommerce.order_service.producer.OrderEventPublisher;
import com.ecommerce.order_service.repository.OrderRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository repository;
    private final CatalogClient catalogClient;
    private final OrderEventPublisher orderEventPublisher;

    public OrderController(OrderRepository repository, CatalogClient catalogClient, OrderEventPublisher orderEventPublisher) {
        this.repository = repository;
        this.catalogClient = catalogClient;
        this.orderEventPublisher = orderEventPublisher;
    }

    @GetMapping
    public List<Order> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public Order getById(@PathVariable Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));
    }

@PostMapping
public Order create(@RequestBody Order order, @AuthenticationPrincipal Jwt jwt) {
    order.setCustomerId(jwt.getSubject());

    BigDecimal total = BigDecimal.ZERO;
    for (OrderItem item : order.getItems()) {
        ProductResponse product;
        try {
            product = catalogClient.getProduct(item.getProductId());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
        item.setUnitPrice(product.getPrice());
        item.setOrder(order);
        total = total.add(product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
    }

    order.setTotalAmount(total);
    Order saved = repository.save(order);

    // Fire-and-forget: notify inventory to reserve stock. Non-blocking (async) Kafka send,
    // so the HTTP response isn't held up waiting for inventory to process the order.
    orderEventPublisher.publishOrderCreated(saved.getId(), saved.getItems());

    return saved;
}

    /** Request body for PUT /api/orders/{id}/status. */
    public record OrderStatusRequest(String status) {}
}