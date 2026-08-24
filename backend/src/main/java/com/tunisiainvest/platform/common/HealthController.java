package com.tunisiainvest.platform.common;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api")
@Tag(name = "Service", description = "État du service")
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> sante() {
        return Map.of("status", "ok", "service", "Tunisia Invest API");
    }
}
