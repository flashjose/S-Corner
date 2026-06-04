package com.scorner.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scorner.entity.ExamCategory;
import com.scorner.repository.ExamCategoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ExamControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ExamCategoryRepository categoryRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void listCategories_returnsOk() throws Exception {
        mockMvc.perform(get("/api/exam/categories"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    void importContent_withEmptyBody_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/exam/content/import")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void getPapersByCategory_whenExists_returnsSections() throws Exception {
        ExamCategory cat = categoryRepository.findBySlug("cet4").orElse(null);
        if (cat == null) return;

        mockMvc.perform(get("/api/exam/cet4"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.sections").isArray())
            .andExpect(jsonPath("$.totalPapers").isNumber());
    }
}
