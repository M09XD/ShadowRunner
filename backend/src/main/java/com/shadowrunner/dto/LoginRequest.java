package com.shadowrunner.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SuppressWarnings("unused")
public class LoginRequest {
    private String email;
    private String password;
}
