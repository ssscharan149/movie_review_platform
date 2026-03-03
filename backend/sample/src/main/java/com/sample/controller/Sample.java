package com.sample.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class Sample {
    @GetMapping("/hello")
    public String hello() {
        return "Backend connected";
    }
}
