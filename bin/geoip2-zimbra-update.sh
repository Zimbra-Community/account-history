#!/bin/bash
echo "Installing/updating GeoIP2"
rm -Rf /opt/GeoIP2-Zimbra
mkdir /opt/GeoIP2-Zimbra
cd /opt/GeoIP2-Zimbra
wget https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=ShaZphSuBJYC5vgf&suffix=tar.gz -O GeoLite2-City.tar.gz
tar --strip-components 1 -xvf GeoLite2-City.tar.gz
rm -f /opt/GeoIP2-Zimbra/GeoLite2-City.tar.gz



