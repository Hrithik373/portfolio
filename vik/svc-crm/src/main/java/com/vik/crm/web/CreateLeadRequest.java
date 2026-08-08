package com.vik.crm.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateLeadRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        String note,
        String source) {
}
