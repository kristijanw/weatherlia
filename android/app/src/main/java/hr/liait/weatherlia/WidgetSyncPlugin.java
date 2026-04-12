package hr.liait.weatherlia;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetSync")
public class WidgetSyncPlugin extends Plugin {
    private static final String PREFS_NAME = "weatherlia_widget";
    private static final String KEY_FAVORITE_CITY = "favorite_city";

    @PluginMethod
    public void setFavoriteCity(PluginCall call) {
        String city = call.getString("city", "");
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_FAVORITE_CITY, city).apply();

        WeatherWidgetProvider.updateAllWidgets(context);

        JSObject result = new JSObject();
        result.put("ok", true);
        call.resolve(result);
    }
}
