package com.shadowrunner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
@SuppressWarnings("unused")
public class ShadowRunnerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShadowRunnerApplication.class, args);
    }
}
