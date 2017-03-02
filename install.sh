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

mkdir -p /opt/zimbra/lib/ext/accountHistory
wget --no-cache https://github.com/Zimbra-Community/account-history/raw/master/extension/out/artifacts/accountHistory_jar/accountHistory.jar -O /opt/zimbra/lib/ext/accountHistory/accountHistory.jar

echo "audit_logs=/opt/zimbra/log/audit.log" > /opt/zimbra/lib/ext/accountHistory/config.properties

echo "Check if git and zip are installed."
set +e
YUM_CMD=$(which yum)
APT_CMD=$(which apt-get)
GIT_CMD=$(which git)
ZIP_CMD=$(which zip)
set -e 

if [[ -z $GIT_CMD ]] || [[ -z $ZIP_CMD ]]; then
   if [[ ! -z $YUM_CMD ]]; then
      yum install -y git zip
   else
      apt-get install -y git zip
   fi
fi

TMPFOLDER="$(mktemp -d /tmp/accountHistory.XXXXXXXX)"
echo "Download accountHistory to $TMPFOLDER"
cd $TMPFOLDER
git clone https://github.com/Zimbra-Community/account-history
cd account-history/zimlet

rm -Rf /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_account_history/
mkdir -p /opt/zimbra/zimlets-deployed/_dev/
cp -rv tk_barrydegraaff_account_history /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_account_history

rm -Rf $TMPFOLDER

echo "--------------------------------------------------------------------------------------------------------------"
echo "You still need to restart some services to load the changes:"
echo "su - zimbra -c \"zmmailboxdctl restart\""
echo " "
echo "Do you only see internal IP's? check:"
echo " https://github.com/Zimbra-Community/account-history#log-external-ip"
