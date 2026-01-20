package com.projet.route.controller;

import com.projet.route.models.Signalement;
import com.projet.route.repository.SignalementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Controller
public class VisitorController {

    @Autowired
    private SignalementRepository signalementRepository;

    @GetMapping("/visitors")
    public String showMap(Model model) {
        List<Signalement> signalements = signalementRepository.findAll();
        model.addAttribute("signalements", signalements);
        return "visitor-map";
    }
}