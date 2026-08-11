package com.ticketdesk.dashboard.controller;

import com.ticketdesk.dashboard.dto.DashboardDto;
import com.ticketdesk.dashboard.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public ResponseEntity<DashboardDto> getDashboardStats(Principal principal) {
        DashboardDto stats = dashboardService.getDashboardStats(principal.getName());
        return ResponseEntity.ok(stats);
    }
}
