package com.projet.route.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {
    
    // AJOUTE CET ENDPOINT POUR LA RACINE
    @GetMapping("/")
    public Map<String, String> root() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "API Route est opérationnelle!");
        response.put("status", "OK");
        response.put("timestamp", new java.util.Date().toString());
        response.put("endpoints", "/home, /api/health, /actuator/health");
        return response;
    }
    
    @GetMapping("/home")
    public Map<String, String> home() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Home page");
        response.put("status", "OK");
        return response;
    }
    
    @GetMapping("/api/health")
    public Map<String, Object> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Route API");
        health.put("time", new java.util.Date().toString());
        return health;
    }
}