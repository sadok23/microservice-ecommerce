package com.ecommerce.inventory_service.repository;

import com.ecommerce.inventory_service.domain.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {

    Optional<Stock> findByProductId(Long productId);

    boolean existsByProductId(Long productId);
}
