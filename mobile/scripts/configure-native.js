// Run after `cap add ios|android`: phones are locked to portrait, tablets can turn either way.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const which = process.argv[2];

if (which === "ios") {
  const plist = path.join(root, "ios/App/App/Info.plist");
  let s = fs.readFileSync(plist, "utf8");
  // Replace whatever orientation lists Capacitor wrote with ours.
  s = s.replace(/\s*<key>UISupportedInterfaceOrientations(~ipad)?<\/key>\s*<array>[\s\S]*?<\/array>/g, "");
  const list = items => `<array>${items.map(o => `\n\t\t<string>UIInterfaceOrientation${o}</string>`).join("")}\n\t</array>`;
  const extra = `
\t<key>UISupportedInterfaceOrientations</key>
\t${list(["Portrait"])}
\t<key>UISupportedInterfaceOrientations~ipad</key>
\t${list(["Portrait", "PortraitUpsideDown", "LandscapeLeft", "LandscapeRight"])}
\t<key>ITSAppUsesNonExemptEncryption</key>
\t<false/>
\t<key>UIStatusBarStyle</key>
\t<string>UIStatusBarStyleLightContent</string>
\t<key>UIViewControllerBasedStatusBarAppearance</key>
\t<false/>`;
  s = s.replace(/<dict>/, `<dict>${extra}`);
  fs.writeFileSync(plist, s);
  console.log("iOS: iPhone portrait only, iPad any orientation");
}

if (which === "android") {
  // Phones: portrait. Tablets (smallest width 600dp+): any orientation.
  const dir = path.join(root, "android/app/src/main/java");
  const find = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? find(path.join(d, e.name)) : e.name === "MainActivity.java" ? [path.join(d, e.name)] : []);
  const file = find(dir)[0];
  const pkg = fs.readFileSync(file, "utf8").match(/^package [^;]+;/m)[0];
  fs.writeFileSync(file, `${pkg}

import android.content.pm.ActivityInfo;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        boolean tablet = getResources().getConfiguration().smallestScreenWidthDp >= 600;
        setRequestedOrientation(tablet ? ActivityInfo.SCREEN_ORIENTATION_FULL_USER : ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
    }
}
`);
  console.log("Android: phones portrait only, tablets any orientation");
}
