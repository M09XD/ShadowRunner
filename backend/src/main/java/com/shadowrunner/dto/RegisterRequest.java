package com.shadowrunner.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SuppressWarnings("unused")
public class RegisterRequest {
    private String email;
    private String password;
    private String playerName;
}
