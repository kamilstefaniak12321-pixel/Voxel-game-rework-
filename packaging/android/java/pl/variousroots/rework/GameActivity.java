package pl.variousroots.rework;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.webkit.WebResourceResponse;
import android.widget.Toast;
import java.io.ByteArrayInputStream;
import java.util.regex.Pattern;
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
    private static final String REPO = "kamilstefaniak12321-pixel/Voxel-game-rework-";
    private static final String FEED = "https://api.github.com/repos/" + REPO + "/releases?per_page=100";
    private static final Pattern RELEASE_LINK = Pattern.compile(
        Pattern.quote("https://github.com/" + REPO + "/releases/") +
        "(?:tag/v[0-9]+\\.[0-9]+\\.[0-9]+|download/v([0-9]+\\.[0-9]+\\.[0-9]+)/Various-Roots-\\1-Android\\.apk)");
    private WebView game;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        game = new WebView(this);
        game.setBackgroundColor(0xff293a33);
        game.getSettings().setJavaScriptEnabled(true);
        game.getSettings().setAllowFileAccess(false);
        game.getSettings().setAllowContentAccess(false);
        game.getSettings().setBlockNetworkLoads(false);
        game.setLongClickable(false);
        game.setOnLongClickListener(view -> true);
        game.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request.isForMainFrame() && request.hasGesture()
                        && RELEASE_LINK.matcher(request.getUrl().toString()).matches()) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, request.getUrl()));
                    } catch (ActivityNotFoundException error) {
                        Toast.makeText(view.getContext(), "Zainstaluj przeglądarkę, aby otworzyć wydanie.", Toast.LENGTH_LONG).show();
                    }
                }
                return true;
            }

            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String scheme = request.getUrl().getScheme();
                if (!"https".equals(scheme) && !"http".equals(scheme)) return null;
                if (FEED.equals(request.getUrl().toString()) && "GET".equals(request.getMethod())) return null;
                return new WebResourceResponse("text/plain", "UTF-8", 403, "Blocked", null,
                    new ByteArrayInputStream(new byte[0]));
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
