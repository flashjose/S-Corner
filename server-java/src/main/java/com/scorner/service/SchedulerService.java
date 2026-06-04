package com.scorner.service;

import com.scorner.entity.RssFeed;
import com.scorner.repository.RssFeedRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Profile("legacy")
public class SchedulerService {

    private static final Logger log = LoggerFactory.getLogger(SchedulerService.class);

    private final RssFeedRepository rssFeedRepository;
    private final RssService rssService;

    public SchedulerService(RssFeedRepository rssFeedRepository, RssService rssService) {
        this.rssFeedRepository = rssFeedRepository;
        this.rssService = rssService;
    }

    /**
     * 每分钟检查一次，到了预定时间就抓取对应的 feed
     * 只在生产环境启用（通过配置控制）
     */
    @Scheduled(cron = "0 * * * * *")
    public void checkAndFetchFeeds() {
        LocalDateTime now = LocalDateTime.now();
        int currentHour = now.getHour();
        int currentMinute = now.getMinute();

        List<RssFeed> feeds = rssFeedRepository.findByIsActiveTrue();

        for (RssFeed feed : feeds) {
            if (feed.getFetchHour() == currentHour && feed.getFetchMinute() == currentMinute) {
                log.info("Scheduled fetch triggered for: {}", feed.getName());
                try {
                    rssService.fetchFeed(feed.getId());
                    log.info("Scheduled fetch completed for: {}", feed.getName());
                } catch (Exception e) {
                    log.error("Scheduled fetch failed for {}: {}", feed.getName(), e.getMessage());
                }
            }
        }
    }
}
