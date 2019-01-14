#!/bin/bash
echo "Installing/updating GeoIP2"
rm -Rf /opt/GeoIP2-Zimbra
mkdir /opt/GeoIP2-Zimbra
cd /opt/GeoIP2-Zimbra
wget https://geolite.maxmind.com/download/geoip/database/GeoLite2-City.tar.gz
tar --strip-components 1 -xvf GeoLite2-City.tar.gz
rm -f /opt/GeoIP2-Zimbra/GeoLite2-City.tar.gz
