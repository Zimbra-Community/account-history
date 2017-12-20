Zimbra Recent Account Activity (beta)
==========
A Zimbra extension that allows the user to monitor their recent login and account activity. This is important to keep the user's account safe.

If you find Zimbra Recent Account Activity useful and want to support its continued development, you can make donations via:
- PayPal: info@barrydegraaff.tk
- Bank transfer: IBAN NL55ABNA0623226413 ; BIC ABNANL2A

Designed for Zimbra version 8.7/8.8.

Bugs and feedback: https://github.com/Zimbra-Community/account-history/issues

Report security issues to info@barrydegraaff.tk (PGP fingerprint: 97f4694a1d9aedad012533db725ddd156d36a2d0)

========================================================================

### Installing
Use the automated installer:

    wget --no-cache https://github.com/Zimbra-Community/account-history/raw/master/account-history-installer.sh -O /tmp/account-history-installer.sh
    chmod +rx /tmp/account-history-installer.sh
    /tmp/account-history-installer.sh

========================================================================

### Screenshot of Client Zimlet
![alt tag](https://raw.githubusercontent.com/Zimbra-Community/account-history/master/help/client-zimlet.png)

### Screenshot of Admin Zimlet and extension
![alt tag](https://raw.githubusercontent.com/Zimbra-Community/account-history/master/help/admin-zimlet.png)

========================================================================

### Log external ip
If you only see internal IP's in the account history, you need to configure Zimbra to log the IP from the X-Forwarded-For header.
[https://wiki.zimbra.com/wiki/Log_Files#Logging_the_Originating_IP](https://wiki.zimbra.com/wiki/Log_Files#Logging_the_Originating_IP)

    zmlocalconfig zimbra_http_originating_ip_header
    zimbra_http_originating_ip_header = X-Forwarded-For
    
    zmprov mcf +zimbraMailTrustedIP 127.0.0.1
    zmprov mcf +zimbraMailTrustedIP <proxy ip here>
    zmprov mcf +zimbraMailTrustedIP <more proxy here>
    

### Configuring preferences
Support a semi-colon separated list of log files, only the audit.og log4j format is supported.

    nano /opt/zimbra/lib/ext/accountHistory/config.properties
    audit_logs=/opt/zimbra/log/audit.log;/opt/zimbra/log/sync.log
    
You can also have the extension read gzipped files (after log rotation), for now, it only reads yesterdays gz log.    

    nano /opt/zimbra/lib/ext/accountHistory/config.properties
    audit_logs=/opt/zimbra/log/audit.log;/opt/zimbra/log/audit.log.yyyy-MM-dd.gz
