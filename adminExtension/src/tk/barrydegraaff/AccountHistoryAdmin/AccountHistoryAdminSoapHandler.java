/*

Copyright (C) 2016  Barry de Graaff

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

*/
package tk.barrydegraaff.AccountHistoryAdmin;

import java.io.*;
import java.util.Map;

import com.zimbra.common.service.ServiceException;
import com.zimbra.common.soap.Element;
import com.zimbra.soap.DocumentHandler;
import com.zimbra.soap.ZimbraSoapContext;

import java.util.regex.Pattern;
import java.util.regex.Matcher;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Properties;
import java.util.zip.GZIPInputStream;

public class AccountHistoryAdminSoapHandler extends DocumentHandler {
    public Element handle(Element request, Map<String, Object> context)
            throws ServiceException {
        try {

            ZimbraSoapContext zsc = getZimbraSoapContext(context);
            Element response = zsc.createElement(
                    "AccountHistoryAdminResponse"
            );

            switch (request.getAttribute("action")) {
                case "getAccounts":
                    Element accounts = response.addNonUniqueElement("content");
                    accounts.addAttribute("accounts", this.runCommand("/opt/zimbra/bin/zmprov", "-l", "gaa"));
                    break;
                case "geoIpLookup":
                    geoIpLookup geoIpLookup = new geoIpLookup();
                    String result = geoIpLookup.doIPGeoLookup(request.getAttribute("ip"));
                    Element content = response.addNonUniqueElement("content");
                    content.addAttribute("geoIpResult", result);
                    break;
                case "getLog":
                    if(this.validate(request.getAttribute("account")))
                    {
                       String[] logs = getLogUris();
                       for (String log : logs) {
                          response = parseLogs(log, request.getAttribute("account"), response);
                       }
                    }    
                    break;
            }

            return response;

        } catch (
                Exception e)

        {
            throw ServiceException.FAILURE("AccountHistoryAdminSoapHandler ServiceException ", e);
        }

    }

    public static final Pattern VALID_EMAIL_ADDRESS_REGEX =
            Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,6}$", Pattern.CASE_INSENSITIVE);

    public static boolean validate(String emailStr) {
        Matcher matcher = VALID_EMAIL_ADDRESS_REGEX.matcher(emailStr);
        return matcher.find();
    }

    private Element parseLogs(String logUri, String userName, Element response) {

        String strLine;
        BufferedReader br;
        FileInputStream fstream;
        try {
            //Support gz files syntax: /opt/zimbra/log/audit.log.yyyy-MM-dd.gz
            //for now it only supports reading yesterday, to-do add number of days to read
            if (logUri.substring(logUri.length() - 3).equals(".gz")) {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
                Date yesterday = new Date(System.currentTimeMillis() - 1000L * 60L * 60L * 24L);
                InputStream fileStream = new FileInputStream(logUri.replace("yyyy-MM-dd",sdf.format(yesterday)));
                fstream = new FileInputStream(logUri.replace("yyyy-MM-dd",sdf.format(yesterday)));
                InputStream gzipStream = new GZIPInputStream(fileStream);
                Reader decoder = new InputStreamReader(gzipStream, "UTF-8");
                br = new BufferedReader(decoder);
            } else {
                fstream = new FileInputStream(logUri);
                br = new BufferedReader(new InputStreamReader(fstream));
            }

            while ((strLine = br.readLine()) != null) {
                String[] columns = strLine.split(" ", 6);


                Date date = null;
                try {
                    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
                    date = sdf.parse(columns[0]);
                    if (!columns[0].equals(sdf.format(date))) {
                        date = null;
                    }
                } catch (ParseException ex) {
                    // ex.printStackTrace();
                }
                if (date == null) {
                    // Invalid date format, avoid information leakage
                    continue;
                }

                String pattern = ".*account=(.*?);";
                Pattern r = Pattern.compile(pattern);
                Matcher m = r.matcher(columns[5]);

                if (m.find()) {

                    if (!userName.equals(m.group(1))) {
                        //log line does not belong to this user
                        continue;
                    }
                } else {
                    //no account= found, skip this
                    continue;
                }
                Element content = response.addNonUniqueElement("content");
                content.addAttribute("logEntry", strLine);
            }
            fstream.close();

        } catch (Exception e) {
            e.printStackTrace();
        }
        return response;
    }

    private String[] getLogUris() {
        Properties prop = new Properties();
        try {
            FileInputStream input = new FileInputStream("/opt/zimbra/lib/ext/accountHistory/config.properties");
            prop.load(input);
            input.close();
        } catch (Exception ex) {
        }
        return prop.getProperty("audit_logs").split(";");
    }

    private String runCommand(String cmd, String arg1, String arg2) throws ServiceException {
        try {
            ProcessBuilder pb = new ProcessBuilder()
                    .command(cmd, arg1, arg2)
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

        } catch (
                Exception e)

        {
            throw ServiceException.FAILURE("AccountHistoryAdminSoapHandler runCommand exception", e);
        }
    }

}
