#!/bin/bash

# Copyright (C) 2017-2019  Barry de Graaff
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 2 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see http://www.gnu.org/licenses/.

# We only support java versions bundled with Zimbra
if [[ -x "/opt/zimbra/common/bin/java" ]]
then
   #8.7+
    [[ ":$PATH:" != *":/opt/zimbra/common/bin:"* ]] && PATH="/opt/zimbra/common/bin:${PATH}"
    export PATH
else
    echo "Java is not found in /opt/zimbra"
    exit 1
fi

set -e
# if you want to trace your script uncomment the following line
# set -x

# Make sure only root can run our script
if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

echo ""
echo "Do you want to install the client Zimlet and Extension? Y/n:"
read YNCLIENT;

echo ""
echo "Do you want to install the admin Zimlet and Extension? Y/n:"
read YNADMIN;

echo "Check if git and zip are installed."
set +e
YUM_CMD=$(which yum)
APT_CMD=$(which apt-get)
set -e 

#to-do test Ubuntu
if [[ ! -z $YUM_CMD ]]; then
   yum install -y git zip
else
   apt-get install -y git zip
fi


# always need this folder
mkdir -p /opt/zimbra/lib/ext/accountHistory

TMPFOLDER="$(mktemp -d /tmp/accountHistory.XXXXXXXX)"
echo "Download accountHistory to $TMPFOLDER"

echo "Saving existing configuration to $TMPFOLDER/upgrade"
mkdir $TMPFOLDER/upgrade
if [ -f /opt/zimbra/lib/ext/accountHistory/config.properties ]; then
   cp /opt/zimbra/lib/ext/accountHistory/config.properties $TMPFOLDER/upgrade
fi 

echo "Remove existing accountHistory."
rm -Rf /opt/zimbra/lib/ext/accountHistory
rm -Rf /opt/zimbra/lib/ext/AccountHistoryAdmin
rm -Rf /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_account_history  
mkdir -p /opt/zimbra/lib/ext/accountHistory
echo "audit_logs=/opt/zimbra/log/audit.log;/opt/zimbra/log/sync.log;/opt/zimbra/log/audit.log.yyyy-MM-dd.gz;/opt/zimbra/log/sync.log.yyyy-MM-dd.gz" > /opt/zimbra/lib/ext/accountHistory/config.properties

cd $TMPFOLDER
git clone --depth=1 https://github.com/Zimbra-Community/account-history

echo "Installing Client Zimlet."
if [[ "$YNCLIENT" == 'N' || "$YNCLIENT" == 'n' ]];
then
   echo "Skipped per user request."
else
   echo "Deploy client Zimlet"
   cd $TMPFOLDER
   cd account-history/zimlet

   rm -Rf /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_account_history/
   mkdir -p /opt/zimbra/zimlets-deployed/_dev/
   cp -rv tk_barrydegraaff_account_history /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_account_history  
  
   echo "Deploy client extension"
   cd $TMPFOLDER
   cp account-history/extension/out/artifacts/accountHistory_jar/accountHistory.jar /opt/zimbra/lib/ext/accountHistory/accountHistory.jar
   cp account-history/extension/lib/maxmind-db-1.2.2.jar /opt/zimbra/lib/ext/accountHistory/maxmind-db-1.2.2.jar
   cp account-history/extension/lib/geoip2-2.12.0.jar /opt/zimbra/lib/ext/accountHistory/geoip2-2.12.0.jar
fi

echo "Installing Admin Zimlet."
if [[ "$YNADMIN" == 'N' || "$YNADMIN" == 'n' ]];
then
   echo "Skipped per user request."
else
   echo "Deploy admin Zimlet"
   su - zimbra -c "zmzimletctl undeploy tk_barrydegraaff_accounthistory_admin"
   rm -f /tmp/tk_barrydegraaff_accounthistory_admin.zip

   cd $TMPFOLDER
   cd account-history/adminZimlet/tk_barrydegraaff_accounthistory_admin/
   zip -r /tmp/tk_barrydegraaff_accounthistory_admin.zip *
   su - zimbra -c "zmzimletctl deploy /tmp/tk_barrydegraaff_accounthistory_admin.zip" 
   
   echo "Deploy Admin server extension"
   mkdir -p /opt/zimbra/lib/ext/AccountHistoryAdmin
   cd $TMPFOLDER
   cp account-history/adminExtension/out/artifacts/AccountHistoryAdmin/AccountHistoryAdmin.jar /opt/zimbra/lib/ext/AccountHistoryAdmin/AccountHistoryAdmin.jar
   cp account-history/extension/lib/maxmind-db-1.2.2.jar /opt/zimbra/lib/ext/AccountHistoryAdmin/maxmind-db-1.2.2.jar
   cp account-history/extension/lib/geoip2-2.12.0.jar /opt/zimbra/lib/ext/AccountHistoryAdmin/geoip2-2.12.0.jar
fi

echo "Flushing Zimlet Cache."
su - zimbra -c "zmprov fc all"

echo "Installing/updating GeoIP2"
rm -Rf /opt/GeoIP2-Zimbra
mkdir /opt/GeoIP2-Zimbra
cd /opt/GeoIP2-Zimbra
wget https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=ShaZphSuBJYC5vgf&suffix=tar.gz -O GeoLite2-City.tar.gz
tar --strip-components 1 -xvf GeoLite2-City.tar.gz
rm -f /opt/GeoIP2-Zimbra/GeoLite2-City.tar.gz

echo "Deploy CLI tools"
cd $TMPFOLDER
cp -rv account-history/bin/* /usr/local/sbin/


echo "Restoring config.properties"
cd $TMPFOLDER/upgrade/
wget --no-cache https://github.com/Zimbra-Community/propmigr/raw/master/out/artifacts/propmigr_jar/propmigr.jar
java -jar $TMPFOLDER/upgrade/propmigr.jar $TMPFOLDER/upgrade/config.properties /opt/zimbra/lib/ext/accountHistory/config.properties

rm -Rf $TMPFOLDER


echo "--------------------------------------------------------------------------------------------------------------"
echo "Zimbra Account History installed successful."
echo "You still need to restart some services to load the changes:"
echo "su - zimbra -c \"zmmailboxdctl restart\""
echo " "
echo "Do you only see internal or blank IP's? check:"
echo " https://github.com/Zimbra-Community/account-history#log-external-ip"
echo " "
echo "GeoIP2 database is not updated periodically, while the installer updated it just now, you can update it in the future by running:"
echo " /usr/local/sbin/geoip2-zimbra-update.sh"
