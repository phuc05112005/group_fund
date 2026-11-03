package com.groupfund.backend.config;

import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KeycloakConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
    private String issuerUri;

    @Bean
    public Keycloak keycloakAdminClient() {
        // Lấy domain root (http://localhost:8080) từ issuer-uri
        String serverUrl = issuerUri.substring(0, issuerUri.indexOf("/realms"));

        return KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm("master") // Realm quản trị của Keycloak
                .clientId("admin-cli")
                .username("admin") // Username tài khoản Admin Keycloak
                .password("admin") // Password tài khoản Admin Keycloak
                .build();
    }
}