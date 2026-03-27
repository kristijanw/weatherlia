package com.weatherlia.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URLEncoder;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.ArrayList;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class WeatherWidgetProvider extends AppWidgetProvider {
    private static final String PREFS_NAME = "weatherlia_widget";
    private static final String KEY_FAVORITE_CITY = "favorite_city";
    private static final String WEATHER_API_KEY = "ac0de5ee55aa4d1f8c9124443262703";
    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor();

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        refreshWidgets(context, appWidgetManager, appWidgetIds);
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName widget = new ComponentName(context, WeatherWidgetProvider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(widget);
        refreshWidgets(context, appWidgetManager, appWidgetIds);
    }

    private static void refreshWidgets(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        if (appWidgetIds == null || appWidgetIds.length == 0) {
            return;
        }

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String city = prefs.getString(KEY_FAVORITE_CITY, "").trim();

        if (city.isEmpty()) {
            for (int appWidgetId : appWidgetIds) {
                updateWidget(
                        context,
                        appWidgetManager,
                        appWidgetId,
                        context.getString(R.string.widget_no_city),
                        context.getString(R.string.widget_temp_placeholder),
                        context.getString(R.string.widget_condition_placeholder),
                        context.getString(R.string.widget_humidity_placeholder),
                        context.getString(R.string.widget_wind_placeholder),
                        context.getString(R.string.widget_feels_like_placeholder),
                        "⛅",
                        R.drawable.widget_background
                );
            }
            return;
        }

        for (int appWidgetId : appWidgetIds) {
            updateWidget(
                    context,
                    appWidgetManager,
                    appWidgetId,
                    city,
                    context.getString(R.string.widget_loading),
                    context.getString(R.string.widget_condition_loading),
                    context.getString(R.string.widget_humidity_placeholder),
                    context.getString(R.string.widget_wind_placeholder),
                    context.getString(R.string.widget_feels_like_placeholder),
                    "⛅",
                    R.drawable.widget_background
            );
        }

        EXECUTOR.execute(() -> {
            WeatherSnapshot snapshot = new WeatherSnapshot(
                    context.getString(R.string.widget_temp_placeholder),
                    context.getString(R.string.widget_condition_placeholder),
                    context.getString(R.string.widget_humidity_placeholder),
                    context.getString(R.string.widget_wind_placeholder),
                    context.getString(R.string.widget_feels_like_placeholder),
                    "⛅",
                    R.drawable.widget_background
            );
            try {
                snapshot = fetchWeatherForCity(city, context);
            } catch (Exception ignored) {
                // Keep placeholder values on network errors.
            }

            for (int appWidgetId : appWidgetIds) {
                updateWidget(
                        context,
                        appWidgetManager,
                        appWidgetId,
                        city,
                        snapshot.temperature,
                        snapshot.condition,
                        snapshot.humidity,
                        snapshot.wind,
                        snapshot.feelsLike,
                        snapshot.icon,
                        snapshot.backgroundRes
                );
            }
        });
    }

    private static void updateWidget(
            Context context,
            AppWidgetManager appWidgetManager,
            int appWidgetId,
            String city,
            String temperature,
            String condition,
            String humidity,
            String wind,
            String feelsLike,
            String icon,
            int backgroundRes
    ) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.weather_widget);
        views.setTextViewText(R.id.widget_title, context.getString(R.string.widget_label));
        views.setTextViewText(R.id.widget_city, city);
        views.setTextViewText(R.id.widget_temp, temperature);
        views.setTextViewText(R.id.widget_icon, icon);
        views.setTextViewText(R.id.widget_condition, condition);
        views.setTextViewText(R.id.widget_humidity_value, humidity);
        views.setTextViewText(R.id.widget_wind_value, wind);
        views.setTextViewText(R.id.widget_feels_like_value, feelsLike);
        views.setInt(R.id.widget_root, "setBackgroundResource", backgroundRes);

        String currentTime = new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date());
        String updatedText = context.getString(R.string.widget_updated_prefix) + " " + currentTime;
        views.setTextViewText(R.id.widget_updated, updatedText);

        Intent launchIntent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static WeatherSnapshot fetchWeatherForCity(String city, Context context) throws Exception {
        String encodedCity = URLEncoder.encode(city, "UTF-8");
        String urlString = "https://api.weatherapi.com/v1/current.json?key=" + WEATHER_API_KEY + "&q=" + encodedCity + "&lang=hr";
        URL url = new URL(urlString);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("GET");
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(10000);

        int statusCode = connection.getResponseCode();
        if (statusCode != 200) {
            throw new IllegalStateException("Weather API request failed with status " + statusCode);
        }

        BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
        ArrayList<String> lines = new ArrayList<>();
        String line;
        while ((line = reader.readLine()) != null) {
            lines.add(line);
        }
        reader.close();
        connection.disconnect();

        StringBuilder response = new StringBuilder();
        for (String part : lines) {
            response.append(part);
        }

        JSONObject json = new JSONObject(response.toString());
        JSONObject current = json.getJSONObject("current");

        String temperature = Math.round(current.getDouble("temp_c")) + "°C";
        JSONObject conditionObject = current.getJSONObject("condition");
        String condition = conditionObject.getString("text");
        int conditionCode = conditionObject.getInt("code");
        int isDay = current.getInt("is_day");
        String humidity = current.getInt("humidity") + "%";
        String wind = Math.round(current.getDouble("wind_kph")) + " km/h";
        String feelsLike = Math.round(current.getDouble("feelslike_c")) + "°C";

        if (condition.isEmpty()) {
            condition = context.getString(R.string.widget_condition_placeholder);
        }

        return new WeatherSnapshot(
                temperature,
                condition,
                humidity,
                wind,
                feelsLike,
                getWeatherIcon(conditionCode, isDay == 1),
                getWeatherBackground(conditionCode)
        );
    }

    private static String getWeatherIcon(int code, boolean isDay) {
        if (code == 1000) return isDay ? "☀️" : "🌙";
        if (code == 1003) return isDay ? "🌤️" : "☁️";
        if (code == 1006 || code == 1009) return "☁️";
        if (code == 1030 || code == 1135 || code == 1147) return "🌫️";
        if (code == 1063 || code == 1180 || code == 1183 || code == 1186 || code == 1189 || code == 1192 || code == 1195 || code == 1240 || code == 1243 || code == 1246) return "🌧️";
        if (code == 1066 || code == 1114 || code == 1117 || code == 1210 || code == 1213 || code == 1216 || code == 1219 || code == 1222 || code == 1225 || code == 1255 || code == 1258) return "❄️";
        if (code == 1069 || code == 1072 || code == 1168 || code == 1171 || code == 1198 || code == 1201 || code == 1204 || code == 1207 || code == 1237 || code == 1249 || code == 1252 || code == 1261 || code == 1264) return "🧊";
        if (code == 1087 || code == 1273 || code == 1276 || code == 1279 || code == 1282) return "⛈️";
        return "⛅";
    }

    private static int getWeatherBackground(int code) {
        if (code == 1000) return R.drawable.widget_background_clear;
        if (code == 1003 || code == 1006 || code == 1009) return R.drawable.widget_background_cloudy;
        if (code == 1030 || code == 1135 || code == 1147) return R.drawable.widget_background_cloudy;
        if (code == 1087 || code == 1273 || code == 1276 || code == 1279 || code == 1282) return R.drawable.widget_background_storm;
        if (code == 1063 || code == 1180 || code == 1183 || code == 1186 || code == 1189 || code == 1192 || code == 1195 || code == 1240 || code == 1243 || code == 1246) return R.drawable.widget_background_rain;
        if (code == 1066 || code == 1114 || code == 1117 || code == 1210 || code == 1213 || code == 1216 || code == 1219 || code == 1222 || code == 1225 || code == 1255 || code == 1258) return R.drawable.widget_background_snow;
        if (code == 1069 || code == 1072 || code == 1168 || code == 1171 || code == 1198 || code == 1201 || code == 1204 || code == 1207 || code == 1237 || code == 1249 || code == 1252 || code == 1261 || code == 1264) return R.drawable.widget_background_snow;
        return R.drawable.widget_background;
    }

    private static class WeatherSnapshot {
        final String temperature;
        final String condition;
        final String humidity;
        final String wind;
        final String feelsLike;
        final String icon;
        final int backgroundRes;

        WeatherSnapshot(String temperature, String condition, String humidity, String wind, String feelsLike, String icon, int backgroundRes) {
            this.temperature = temperature;
            this.condition = condition;
            this.humidity = humidity;
            this.wind = wind;
            this.feelsLike = feelsLike;
            this.icon = icon;
            this.backgroundRes = backgroundRes;
        }
    }
}
