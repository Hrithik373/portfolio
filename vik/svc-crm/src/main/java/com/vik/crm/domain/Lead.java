package com.vik.crm.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

@Entity
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    /** Free-text: what the recruiter is interested in, source channel, etc. */
    private String note;

    /** e.g. "chat_widget", "card_scan" — how svc-agent captured this lead. */
    private String source;

    private Instant createdAt = Instant.now();

    protected Lead() {
        // JPA
    }

    public Lead(String name, String email, String note, String source) {
        this.name = name;
        this.email = email;
        this.note = note;
        this.source = source;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getNote() {
        return note;
    }

    public String getSource() {
        return source;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
