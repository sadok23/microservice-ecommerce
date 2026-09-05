package com.ecommerce.inventory_service.domain;

import jakarta.persistence.*;

/**
 * The inventory-service owns stock levels. Notice it references products ONLY by their
 * id (productId) - it does not hold a Product entity or a FK to catalog-service's table.
 * This is the "service data ownership boundary" in practice: inventory stores just enough
 * to do its job (which product, how many left) and stays decoupled from catalog.
 */
@Entity
@Table(name = "stock")
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Which catalog product this stock row describes. Unique: one stock row per product. */
    @Column(name = "product_id", nullable = false, unique = true)
    private Long productId;

    @Column(name = "quantity_available", nullable = false)
    private Integer quantityAvailable;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public Integer getQuantityAvailable() { return quantityAvailable; }
    public void setQuantityAvailable(Integer quantityAvailable) { this.quantityAvailable = quantityAvailable; }
}
