package com.vik.crm.web;

import com.vik.crm.domain.Lead;
import com.vik.crm.repo.LeadRepository;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class LeadGraphQLController {

    private final LeadRepository leadRepository;

    public LeadGraphQLController(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    @QueryMapping
    public List<Lead> leads() {
        return leadRepository.findAll();
    }

    @QueryMapping
    public Lead lead(@Argument Long id) {
        return leadRepository.findById(id).orElse(null);
    }

    @SchemaMapping(typeName = "Lead", field = "createdAt")
    public String createdAt(Lead lead) {
        return lead.getCreatedAt().toString();
    }
}
