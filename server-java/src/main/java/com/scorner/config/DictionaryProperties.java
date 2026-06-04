package com.scorner.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.dictionary")
public class DictionaryProperties {

    /** 优先查询本地 ECDICT 词库 */
    private boolean localEnabled = true;

    /** 本地未命中时回退到 dictionaryapi.dev */
    private boolean remoteFallback = true;

    public boolean isLocalEnabled() { return localEnabled; }
    public void setLocalEnabled(boolean localEnabled) { this.localEnabled = localEnabled; }

    public boolean isRemoteFallback() { return remoteFallback; }
    public void setRemoteFallback(boolean remoteFallback) { this.remoteFallback = remoteFallback; }
}
