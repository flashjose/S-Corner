package com.scorner.config;

import com.scorner.entity.ExamCategory;
import com.scorner.entity.ExamPaper;
import com.scorner.repository.ExamCategoryRepository;
import com.scorner.repository.ExamPaperRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final ExamCategoryRepository categoryRepository;
    private final ExamPaperRepository paperRepository;

    public DataSeeder(ExamCategoryRepository categoryRepository, ExamPaperRepository paperRepository) {
        this.categoryRepository = categoryRepository;
        this.paperRepository = paperRepository;
    }

    @Override
    public void run(String... args) {
        if (categoryRepository.count() > 0) {
            log.info("Data already seeded, skipping...");
            return;
        }

        log.info("Seeding exam categories and papers...");

        // ── 考试分类 ──
        ExamCategory kaoyan = createCategory("kaoyan", "历年考研英语", "考研英语历年真题试卷", 1);
        ExamCategory cet6 = createCategory("cet6", "大学英语六级", "CET6 历年真题试卷", 2);
        ExamCategory cet4 = createCategory("cet4", "大学英语四级", "CET4 历年真题试卷", 3);

        // ── CET4 试卷 ──
        createPapers(cet4.getId(), "cet4", "英语四级", new int[][]{
            {2025, 12, 3}, {2025, 6, 3}, {2024, 12, 3}, {2024, 6, 3},
            {2023, 12, 3}, {2023, 6, 3}, {2022, 12, 3}, {2022, 6, 3},
            {2021, 12, 3}, {2021, 6, 3}, {2020, 12, 3}, {2020, 9, 3}, {2020, 7, 3},
        });

        // ── CET6 试卷 ──
        createPapers(cet6.getId(), "cet6", "英语六级", new int[][]{
            {2025, 12, 3}, {2025, 6, 3}, {2024, 12, 3}, {2024, 6, 3},
            {2023, 12, 3}, {2023, 6, 3}, {2022, 12, 3}, {2022, 6, 3},
            {2021, 12, 3}, {2021, 6, 3}, {2020, 12, 3}, {2020, 9, 3}, {2020, 7, 3},
        });

        // ── 考研英语 ──
        createPapers(kaoyan.getId(), "kaoyan", "考研英语", new int[][]{
            {2026, 1, 2}, {2025, 1, 2}, {2024, 1, 2}, {2023, 1, 2},
            {2022, 1, 2}, {2021, 1, 2}, {2020, 1, 2},
        });

        log.info("Seeding completed: {} categories, {} papers",
            categoryRepository.count(), paperRepository.count());
    }

    private ExamCategory createCategory(String slug, String name, String description, int order) {
        ExamCategory cat = new ExamCategory();
        cat.setSlug(slug);
        cat.setName(name);
        cat.setDescription(description);
        cat.setDisplayOrder(order);
        return categoryRepository.save(cat);
    }

    private void createPapers(String categoryId, String categorySlug, String namePrefix, int[][] configs) {
        for (int[] config : configs) {
            int year = config[0];
            int month = config[1];
            int sets = config[2];

            for (int setId = 1; setId <= sets; setId++) {
                String slug = year + "-" + String.format("%02d", month) + "/" + String.format("%02d", setId);
                String title = year + "年" + month + "月" + namePrefix + "真题(第" + setId + "套)";
                String shortTitle = year + "年" + month + "月" + namePrefix.replace("英语", "") + "真题(第" + setId + "套)";

                ExamPaper paper = new ExamPaper();
                paper.setCategoryId(categoryId);
                paper.setYear(year);
                paper.setMonth(month);
                paper.setSetId(setId);
                paper.setSlug(slug);
                paper.setTitle(title);
                paper.setShortTitle(shortTitle);
                paper.setCoverImage("/imgs/papers/" + categorySlug + "-" + year + "-" + month + "-" + setId + ".jpg");
                paper.setPdfUrl("/pdfs/" + categorySlug + "/" + slug + ".pdf");
                paper.setIsPublished(true);
                paperRepository.save(paper);
            }
        }
    }
}
