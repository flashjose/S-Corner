package com.scorner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ScornerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ScornerApplication.class, args);
    }
}
