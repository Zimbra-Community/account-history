/*

Copyright (C) 2017-2019  Barry de Graaff

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
https://github.com/maxmind/GeoIP2-java
*/
package tk.barrydegraaff.accounthistory;

import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.model.CityResponse;
import com.maxmind.geoip2.record.Location;

import java.io.File;
import java.net.InetAddress;

public class geoIpLookup {

    public String doIPGeoLookup(String ip) {

        try {
            // A File object pointing to your GeoIP2 or GeoLite2 database
            File database = new File("/opt/GeoIP2-Zimbra/GeoLite2-City.mmdb");

            // This creates the DatabaseReader object. To improve performance, reuse
            // the object across lookups. The object is thread-safe.
            DatabaseReader reader = new DatabaseReader.Builder(database).build();

            InetAddress ipAddress = InetAddress.getByName(ip);

            // Replace "city" with the appropriate method for your database, e.g.,
            // "country".
            CityResponse response = reader.city(ipAddress);

            Location location = response.getLocation();
            return (" , , , , , , " + location.getLatitude() + ", " + location.getLongitude());
        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }
}