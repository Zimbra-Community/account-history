# Zimbra Recent Account Activity
A Zimbra extension that allows the user to monitor their recent login and account activity. This is important to keep the user's account safe.

# BETA RELEASE

[https://fundrazr.com/d1D8Ud](https://fundrazr.com/d1D8Ud)

### Installing
Use the automated installer:

    wget --no-cache https://github.com/Zimbra-Community/account-history/raw/master/account-history-installer.sh -O /tmp/account-history-installer.sh
    chmod +rx /tmp/account-history-installer.sh
    /tmp/account-history-installer.sh

### Log external ip
If you only see internal IP's in the account history, you need to configure Zimbra to log the IP from the X-Forwarded-For header.
[https://wiki.zimbra.com/wiki/Log_Files#Logging_the_Originating_IP](https://wiki.zimbra.com/wiki/Log_Files#Logging_the_Originating_IP)

    zmlocalconfig zimbra_http_originating_ip_header
    zimbra_http_originating_ip_header = X-Forwarded-For
    
    zmprov mcf +zimbraMailTrustedIP 127.0.0.1
    zmprov mcf +zimbraMailTrustedIP <proxy ip here>
    zmprov mcf +zimbraMailTrustedIP <more proxy here>
    

### Configuring preferences
Support a comma separated list of log files, only the audit.og log4j format is supported.

    nano /opt/zimbra/lib/ext/accountHistory/config.properties
    audit_logs=/opt/zimbra/log/audit.log;/opt/zimbra/log/sync.log
