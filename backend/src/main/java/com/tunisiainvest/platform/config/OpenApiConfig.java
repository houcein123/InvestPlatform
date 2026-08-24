package com.tunisiainvest.platform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI api() {
        final String schema = "bearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("Tunisia Invest — API")
                        .version("1.0.0")
                        .description("Catalogue sectoriel, analyse comparative, paiement PayPal et rapports PDF enrichis par IA."))
                .addSecurityItem(new SecurityRequirement().addList(schema))
                .components(new Components().addSecuritySchemes(schema,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
