package com.ecommerce.catalog_service.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
public class Product {

    /**
     * Fallback image used when no imageUrl is provided. Served by catalog-service itself
     * from src/main/resources/static/images/placeholder.png (copied from infra/placeholder.png)
     * and reachable through the gateway at /images/**. Swap for your own placeholder in one place.
     */
    private static final String DEFAULT_IMAGE_URL = "/images/placeholder.png";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    private String category;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * Locally cached stock availability, kept up to date by consuming "inventory.updated"
     * events from inventory-service (CQRS-style read model). Defaults to true so a brand-new
     * product reads as available until inventory tells us otherwise.
     */
    @Column(name = "in_stock", nullable = false)
    private boolean inStock = true;

    /**
     * URL of the product image. Nullable in the DB (existing rows predate this column);
     * the getter falls back to {@link #DEFAULT_IMAGE_URL} so reads always return a usable value.
     */
    @Column(name = "image_url")
    private String imageUrl;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (imageUrl == null || imageUrl.isBlank()) {
            this.imageUrl = DEFAULT_IMAGE_URL;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isInStock() { return inStock; }
    public void setInStock(boolean inStock) { this.inStock = inStock; }

    /**
     * Returns the fallback placeholder when no image was specified, so the REST API never
     * exposes a blank/null image for a product.
     */
    public String getImageUrl() {
        return (imageUrl == null || imageUrl.isBlank()) ? DEFAULT_IMAGE_URL : imageUrl;
    }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}