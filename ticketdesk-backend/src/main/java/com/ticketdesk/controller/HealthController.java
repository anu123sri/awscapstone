package com.ticketdesk.controller;

import org.springframework.web.bind.annotation.RestController;


import org.springframework.web.bind.annotation.GetMapping;


@RestController
public class HealthController {

    @GetMapping({"/health", "/api/health"})
    public String health() {
        return "UP";
    }
}
