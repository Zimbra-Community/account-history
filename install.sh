#!/bin/bash

# Copyright (C) 2017  Barry de Graaff
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
GIT_CMD=$(which git)
ZIP_CMD=$(which zip)
set -e 

#to-do test Ubuntu
if [[ -z $GIT_CMD ]] || [[ -z $ZIP_CMD ]]; then
   if [[ ! -z $YUM_CMD ]]; then
      yum install -y git zip GeoIP
   else
      apt-get install -y git zip geopip-datbase geoipupdate geoip-database-extra
   fi
fi

# always need this folder
mkdir -p /opt/zimbra/lib/ext/accountHistory

TMPFOLDER="$(mktemp -d /tmp/accountHistory.XXXXXXXX)"
echo "Download accountHistory to $TMPFOLDER"
TMPFOLDER="$(mktemp -d /tmp/webdav-client-installer.XXXXXXXX)"
echo "Saving existing configuration to $TMPFOLDER/upgrade"
mkdir $TMPFOLDER/upgrade
if [ -f /opt/zimbra/lib/ext/accountHistory/config.properties ]; then
   cp /opt/zimbra/lib/ext/accountHistory/config.properties $TMPFOLDER/upgrade
else
   echo "audit_logs=/opt/zimbra/log/audit.log" > /opt/zimbra/lib/ext/accountHistory/config.properties
fi

echo "Installing Client Zimlet."
if [[ "$YNCLIENT" == 'N' || "$YNCLIENT" == 'n' ]];
then
   echo "Skipped per user request."
else
   wget --no-cache https://github.com/Zimbra-Community/account-history/raw/master/extension/out/artifacts/accountHistory_jar/accountHistory.jar -O /opt/zimbra/lib/ext/accountHistory/accountHistory.jar
   
   cd $TMPFOLDER
   git clone --depth=1 https://github.com/Zimbra-Community/account-history
   cd account-history/zimlet

   rm -Rf /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_account_history/
   mkdir -p /opt/zimbra/zimlets-deployed/_dev/
   cp -rv tk_barrydegraaff_account_history /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_account_history  
   echo "Flushing Zimlet Cache."
   su - zimbra -c "zmprov fc all"
fi

echo "Installing Admin Zimlet."
if [[ "$YNADMIN" == 'N' || "$YNADMIN" == 'n' ]];
then
   echo "Skipped per user request."
else
   mkdir -p /opt/zimbra/lib/ext/AccountHistoryAdmin
   wget --no-cache https://github.com/Zimbra-Community/account-history/raw/master/adminExtension/out/artifacts/AccountHistoryAdmin/AccountHistoryAdmin.jar -O /opt/zimbra/lib/ext/AccountHistoryAdmin/AccountHistoryAdmin.jar

   cd $TMPFOLDER
   git clone --depth=1 https://github.com/Zimbra-Community/account-history
   cd account-history/adminZimlet

   rm -Rf /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_accounthistory_admin/
   mkdir -p /opt/zimbra/zimlets-deployed/_dev/
   cp -rv tk_barrydegraaff_accounthistory_admin /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_accounthistory_admin  
   echo "Flushing Zimlet Cache."
   su - zimbra -c "zmprov fc all"
fi

geoipupdate

echo "Restoring config.properties"
cd $TMPFOLDER/upgrade/
wget --no-cache https://github.com/Zimbra-Community/propmigr/raw/master/out/artifacts/propmigr_jar/propmigr.jar
java -jar $TMPFOLDER/upgrade/propmigr.jar $TMPFOLDER/upgrade/config.properties /opt/zimbra/lib/ext/accountHistory/config.properties

rm -Rf $TMPFOLDER


echo "--------------------------------------------------------------------------------------------------------------"
echo "You still need to restart some services to load the changes:"
echo "su - zimbra -c \"zmmailboxdctl restart\""
echo " "
echo "Do you only see internal IP's? check:"
echo " https://github.com/Zimbra-Community/account-history#log-external-ip"
