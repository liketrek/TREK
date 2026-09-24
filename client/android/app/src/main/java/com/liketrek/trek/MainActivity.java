package com.liketrek.trek;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(TrekShellPlugin.class);
        // With a server picked, the WebView loads that server instead of the
        // bundled address screen, so the UI arrives in the version the server
        // runs and on its own origin. BridgeActivity reads `config` while it
        // builds the bridge inside super.onCreate().
        String server = TrekServerStore.getUrl(this);
        if (server != null) {
            config = TrekServerStore.configFor(this, server);
        }
        super.onCreate(savedInstanceState);
    }
}
