# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# TREK's own classes: TrekShellPlugin is reached from JavaScript by name and its
# methods through reflection, so R8 must neither rename nor drop them.
-keep class com.liketrek.trek.** { *; }

# Every Capacitor plugin: the bridge finds plugins by their annotation and calls
# the annotated methods reflectively.
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * {
    @com.getcapacitor.PluginMethod public <methods>;
}

# The WebView bridge: Capacitor's message handler is called from JavaScript
# through @JavascriptInterface, and every plugin class is instantiated by name.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep public class * extends com.getcapacitor.Plugin
