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
                        context.getString(R.string.widget_feels_like_placeholder)
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
                    context.getString(R.string.widget_feels_like_placeholder)
            );
        }

        EXECUTOR.execute(() -> {
            WeatherSnapshot snapshot = new WeatherSnapshot(
                    context.getString(R.string.widget_temp_placeholder),
                    context.getString(R.string.widget_condition_placeholder),
                    context.getString(R.string.widget_humidity_placeholder),
                    context.getString(R.string.widget_wind_placeholder),
                    context.getString(R.string.widget_feels_like_placeholder)
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
                        snapshot.feelsLike
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
            String feelsLike
    ) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.weather_widget);
        views.setTextViewText(R.id.widget_title, context.getString(R.string.widget_label));
        views.setTextViewText(R.id.widget_city, city);
        views.setTextViewText(R.id.widget_temp, temperature);
        views.setTextViewText(R.id.widget_condition, condition);
        views.setTextViewText(R.id.widget_humidity_value, humidity);
        views.setTextViewText(R.id.widget_wind_value, wind);
        views.setTextViewText(R.id.widget_feels_like_value, feelsLike);

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
        String condition = current.getJSONObject("condition").getString("text");
        String humidity = current.getInt("humidity") + "%";
        String wind = Math.round(current.getDouble("wind_kph")) + " km/h";
        String feelsLike = Math.round(current.getDouble("feelslike_c")) + "°C";

        if (condition.isEmpty()) {
            condition = context.getString(R.string.widget_condition_placeholder);
        }

        return new WeatherSnapshot(temperature, condition, humidity, wind, feelsLike);
    }

    private static class WeatherSnapshot {
        final String temperature;
        final String condition;
        final String humidity;
        final String wind;
        final String feelsLike;

        WeatherSnapshot(String temperature, String condition, String humidity, String wind, String feelsLike) {
            this.temperature = temperature;
            this.condition = condition;
            this.humidity = humidity;
            this.wind = wind;
            this.feelsLike = feelsLike;
        }
    }
}
