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
                updateWidget(context, appWidgetManager, appWidgetId, context.getString(R.string.widget_no_city), context.getString(R.string.widget_temp_placeholder));
            }
            return;
        }

        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId, city, context.getString(R.string.widget_loading));
        }

        EXECUTOR.execute(() -> {
            String tempValue = context.getString(R.string.widget_temp_placeholder);
            try {
                String tempC = fetchTemperatureForCity(city);
                tempValue = tempC + "°C";
            } catch (Exception ignored) {
                // Keep placeholder temp on network errors.
            }

            final String finalTempValue = tempValue;
            for (int appWidgetId : appWidgetIds) {
                updateWidget(context, appWidgetManager, appWidgetId, city, finalTempValue);
            }
        });
    }

    private static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId, String city, String temperature) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.weather_widget);
        views.setTextViewText(R.id.widget_title, context.getString(R.string.widget_label));
        views.setTextViewText(R.id.widget_city, city);
        views.setTextViewText(R.id.widget_temp, temperature);

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

    private static String fetchTemperatureForCity(String city) throws Exception {
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
        double tempC = json.getJSONObject("current").getDouble("temp_c");
        return String.valueOf(Math.round(tempC));
    }
}
