package com.scorner.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;

public final class MapUtils {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private MapUtils() {}

    public static Integer getInt(Map<String, Object> map, String key) {
        if (!map.containsKey(key) || map.get(key) == null) return null;
        Object val = map.get(key);
        if (val instanceof Number n) return n.intValue();
        if (val instanceof String s) return Integer.parseInt(s);
        throw new IllegalArgumentException("Invalid integer for key: " + key);
    }

    public static Boolean getBoolean(Map<String, Object> map, String key) {
        if (!map.containsKey(key) || map.get(key) == null) return null;
        Object val = map.get(key);
        if (val instanceof Boolean b) return b;
        if (val instanceof String s) return Boolean.parseBoolean(s);
        throw new IllegalArgumentException("Invalid boolean for key: " + key);
    }

    public static String toJson(Object value) {
        if (value == null) return null;
        if (value instanceof String s) return s;
        try {
            return MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to serialize JSON", e);
        }
    }
}
