package com.vik.crm.web;

import com.vik.crm.domain.Lead;
import com.vik.crm.repo.LeadRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Phase 3 TODO: svc-agent's capture_lead tool should POST here once wired
 * (see svc-agent/app/tools/capture_lead.py) instead of returning a canned
 * stub response.
 */
@RestController
@RequestMapping("/leads")
public class LeadController {

    private final LeadRepository leadRepository;

    public LeadController(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    @PostMapping
    public ResponseEntity<Lead> create(@Valid @RequestBody CreateLeadRequest request) {
        Lead lead = new Lead(request.name(), request.email(), request.note(), request.source());
        Lead saved = leadRepository.save(lead);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public List<Lead> list() {
        return leadRepository.findAll();
    }
}
