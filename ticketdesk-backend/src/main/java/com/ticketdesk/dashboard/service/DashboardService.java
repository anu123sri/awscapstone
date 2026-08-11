package com.ticketdesk.dashboard.service;

import com.ticketdesk.dashboard.dto.DashboardDto;

public interface DashboardService {
    DashboardDto getDashboardStats(String username);
}
