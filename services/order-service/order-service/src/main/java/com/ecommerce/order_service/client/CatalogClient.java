package com.ecommerce.order_service.client;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class CatalogClient {
    private final RestClient restClient;

    public CatalogClient(RestClient.Builder builder) {
        this.restClient = builder.baseUrl("http://localhost:8081").build();
    }

    public ProductResponse getProduct(Long productId) {
        String token = extractToken();

        return restClient.get()
                .uri("/api/products/{id}", productId)
                .headers(headers -> headers.setBearerAuth(token))
                .retrieve()
                .body(ProductResponse.class);
    }

    private String extractToken() {
        JwtAuthenticationToken auth = (JwtAuthenticationToken) SecurityContextHolder
                .getContext()
                .getAuthentication();
        return auth.getToken().getTokenValue();
    }
}