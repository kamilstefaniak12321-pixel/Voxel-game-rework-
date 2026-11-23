package pl.variousroots.rework;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public final class GameActivity extends Activity {
    private WebView game;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        game = new WebView(this);
        game.setBackgroundColor(0xff293a33);
        game.getSettings().setJavaScriptEnabled(true);
        game.getSettings().setAllowFileAccess(false);
        game.getSettings().setAllowContentAccess(false);
        game.getSettings().setBlockNetworkLoads(true);
        game.setLongClickable(false);
        game.setOnLongClickListener(view -> true);
        game.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return true;
            }
        });
        setContentView(game);
        try (InputStream input = getAssets().open("index.html");
             ByteArrayOutputStream contents = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int length;
            while ((length = input.read(buffer)) != -1) contents.write(buffer, 0, length);
            game.loadDataWithBaseURL("https://variousroots.invalid/",
                new String(contents.toByteArray(), StandardCharsets.UTF_8), "text/html", "UTF-8", null);
        } catch (IOException error) {
            throw new IllegalStateException("Brak zasobów gry", error);
        }
    }

    @Override public void onWindowFocusChanged(boolean focused) {
        super.onWindowFocusChanged(focused);
        if (focused) {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        }
    }

    @Override public void onBackPressed() {
        game.evaluateJavascript("window.pauseVariousRoots ? window.pauseVariousRoots() : false",
            consumed -> { if (!"true".equals(consumed)) finish(); });
    }

    @Override protected void onPause() {
        game.evaluateJavascript("window.pauseVariousRoots && window.pauseVariousRoots()", null);
        game.onPause();
        super.onPause();
    }

    @Override protected void onResume() {
        super.onResume();
        game.onResume();
    }

    @Override protected void onDestroy() {
        game.destroy();
        super.onDestroy();
    }
}
