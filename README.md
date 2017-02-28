# Zimbra Recent Account Activity
A Zimbra extension that allows the user to monitor their recent login and account activity. This is important to keep the user's account safe.

# Development version, do not install

[https://fundrazr.com/d1D8Ud](https://fundrazr.com/d1D8Ud)

### Installing
Use the automated installer:

    wget --no-cache https://github.com/Zimbra-Community/account-history/raw/master/install.sh -O /tmp/install.sh
    chmod +rx /tmp/install.sh
    /tmp/install.sh 

### Configuring preferences
Support a comma separated list of log files, only the audit.og log4j format is supported.

    nano /opt/zimbra/lib/ext/accountHistory/config.properties
    audit_logs=/opt/zimbra/log/audit.log;/opt/zimbra/log/sync.log
