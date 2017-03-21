/*

Copyright (C) 2017  Barry de Graaff

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see http://www.gnu.org/licenses/.

See also:
//http://www.programcreek.com/java-api-examples/index.php?source_dir=kraken-master/kraken-generic/src/main/java/org/wikimedia/analytics/kraken/geo/GeoIpLookup.java

*/
package tk.barrydegraaff.AccountHistoryAdmin;

import java.util.regex.Pattern;
import java.util.regex.Matcher;
import java.io.BufferedReader;
import java.io.InputStreamReader;

public class geoIpLookup {

    private static final Pattern IP4PATTERN = Pattern.compile("^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$");
    private static final Pattern IP6PATTERN = Pattern.compile("^(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(?::(?:[0-9]{1,3}\\.){3}[0-9]{1,3})*$");

    public String doIPGeoLookup(String ip) {

        Matcher ip4 = IP4PATTERN.matcher(ip);
        if (ip4.matches()) {
            return runCommand("/usr/bin/geoiplookup", "-f", "/usr/share/GeoIP/GeoLiteCity.dat", ip);
        }
        Matcher ip6 = IP6PATTERN.matcher(ip);
        if (ip6.matches()) {
            return runCommand("/usr/bin/geoiplookup6", "-f", "/usr/share/GeoIP/GeoLiteCountry.dat", ip);
        }
        return "";

    }

    private String runCommand(String cmd, String arg1, String arg2, String arg3) {
        try {
            ProcessBuilder pb = new ProcessBuilder()
                    .command(cmd, arg1, arg2, arg3)
                    .redirectErrorStream(true);
            Process p = pb.start();

            BufferedReader cmdOutputBuffer = new BufferedReader(new InputStreamReader(p.getInputStream()));

            StringBuilder builder = new StringBuilder();
            String aux = "";
            while ((aux = cmdOutputBuffer.readLine()) != null) {
                builder.append(aux);
                builder.append(';');
            }
            String cmdResult = builder.toString();
            return cmdResult;

        } catch (Exception e) {
            System.out.print(e.toString());
            return e.toString();
        }
    }
}
