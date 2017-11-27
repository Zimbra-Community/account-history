/*
Copyright (C) 2014-2016  Barry de Graaff

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
ZaAccountHistoryTab = function(parent, entry) {  
    if (arguments.length == 0) return;
    ZaTabView.call(this, parent,"ZaAccountHistoryTab");
    ZaTabView.call(this, {
        parent:parent,
        iKeyName:"ZaAccountHistoryTab",
        contextId:"ACCOUNT_HISTORY"
    });
    this.setScrollStyle(Dwt.SCROLL);

    var soapDoc = AjxSoapDoc.create("AccountHistoryAdmin", "urn:AccountHistoryAdmin", null);
    soapDoc.getMethod().setAttribute("action", "getAccounts");
    var csfeParams = new Object();
    csfeParams.soapDoc = soapDoc;
    csfeParams.asyncMode = true;
    csfeParams.callback = new AjxCallback(ZaAccountHistoryTab.prototype.getAccountsCallback);
    var reqMgrParams = {} ;
    resp = ZaRequestMgr.invoke(csfeParams, reqMgrParams);

    document.getElementById('ztab__ACCOUNT_HISTORY').innerHTML = '<div style="padding-left:10px"><h1>Account History</h1>' +
    'To review the users recent account activity, enter a user account. <br><br><input type="text" id="AccountHistory-account-c" list="AccountHistory-datalist" placeholder="user@domain.com"><datalist id="AccountHistory-datalist"></datalist>&nbsp;&nbsp;<button id="AccountHistory-btnLookupLog">OK</button>' +
    '<br><br><hr>' +
    '<div id="AccountHistory-status"></div><div id="historyZimletDetails"></div></div>';   

    ZaAccountHistoryTab.prototype.status('Loading auto completion...');
        
    var btnLookupLog = document.getElementById('AccountHistory-btnLookupLog');
    btnLookupLog.onclick = AjxCallback.simpleClosure(this.btnLookupLog);
};


ZaAccountHistoryTab.prototype = new ZaTabView();
ZaAccountHistoryTab.prototype.constructor = ZaAccountHistoryTab;

ZaAccountHistoryTab.prototype.getTabIcon =
    function () {
        return "ClientUpload" ;
    };

ZaAccountHistoryTab.prototype.getTabTitle =
    function () {
        return "Account History";
    };

ZaAccountHistoryTab.prototype.getAccountsCallback = function (result) {
   var dataList = document.getElementById('AccountHistory-datalist');
   var users = result._data.Body.AccountHistoryAdminResponse.content[0].accounts.split(";");
   
   users.sort();
   users.forEach(function(item) 
   {
      // Create a new <option> element.
      var option = document.createElement('option');
      // Set the value using the item in the JSON array.
      option.value = item;
      // Add the <option> element to the <datalist>.
      dataList.appendChild(option);
   });
   ZaAccountHistoryTab.prototype.status('Ready.');
   return;
};

ZaAccountHistoryTab.prototype.btnLookupLog = function () {
    ZaAccountHistoryTab.prototype.status('Retrieving logs...');

    var accountA = document.getElementById('AccountHistory-account-c').value;
  
    if(accountA)
    {
       var soapDoc = AjxSoapDoc.create("AccountHistoryAdmin", "urn:AccountHistoryAdmin", null);
       soapDoc.getMethod().setAttribute("action", "getLog");
       soapDoc.getMethod().setAttribute("account", accountA);
       var csfeParams = new Object();
       csfeParams.soapDoc = soapDoc;
       csfeParams.asyncMode = true;
       csfeParams.callback = new AjxCallback(ZaAccountHistoryTab.prototype.accountHistoryDefaultCallback);
       var reqMgrParams = {} ;
       resp = ZaRequestMgr.invoke(csfeParams, reqMgrParams);
    }   
    else
    {
       ZaAccountHistoryTab.prototype.status('Select or type email address.');
    }
};   
  
   
ZaAccountHistoryTab.prototype.accountHistoryDefaultCallback = function (response) {
      var data = [];
      var length = 0;
      try
      {
         data = response._data.Body.AccountHistoryAdminResponse.content;
         length = response._data.Body.AccountHistoryAdminResponse.content.length;
      }
      catch(err)
      {
         ZaAccountHistoryTab.prototype.status("No data received from server");
         return;
      }
      
      //add unix time to log for sorting
      var newData = [];
      for(var x=0; x < length; x++)
      {
         newData.push(Date.parse(data[x].logEntry.substring(0,19))+","+data[x].logEntry.substring(20,23)+" "+data[x].logEntry);
      }
      newData.sort();
      newData.reverse();
      data = newData;
      newData = "";
       
      //parse log with regex       
      for(var x=0; x < length; x++)
      {
         parsed = [];         
         parsed['raw'] = data[x];
         parsed['date'] = data[x].substring(18,37);

         var oip = /oip=.*?;/.exec(data[x]);
         if(oip)
         {
            if(oip[0].indexOf(',')>0)
            {
               oip[0] = oip[0].substring(0,oip[0].indexOf(','));
            }
            parsed['oip'] = oip[0].replace(/oip=|;/g,"");   
         }
         else
         {
            parsed['oip'] = "";
         }
         
         var ua = /ua=.*?;/.exec(data[x].replace(/;;/g,""));
         if(ua)
         {
            parsed['ua'] = ua[0].replace(/ua=|;/g,"");   
         }
         else
         {
            parsed['ua'] = "";
         }

         var DeviceType = /DeviceType=.*?&/.exec(data[x]);
         if(DeviceType)
         {
            parsed['devicetype'] = DeviceType[0].replace(/DeviceType=|&/g,"");   
         }
         else
         {
            parsed['devicetype'] = "";
         }         

         var protocol = /protocol=.*?;/.exec(data[x]);
         if(protocol)
         {
            parsed['protocol'] = protocol[0].replace(/protocol=|;/g,"");   
         }
         else
         {
            var protocol = /model=.*?;/.exec(data[x]);
            if(protocol)
            {
              parsed['protocol'] = protocol[0].replace(/model=|;/g,"").toLowerCase(); 
            }
            else
            {
               parsed['protocol'] = "";
            }
         }
         if((parsed['oip']!=="")&&(parsed['protocol']!==""))        
         {
            data[x]= parsed;
         }
         else
         {
            data[x]="";
         }
      }      
      var x=0;
      var cleandata=[];
      data.forEach(function(element) {
         if(element!=="")
         {
            cleandata[x]=element;
            x++;
         }
      });

      data = cleandata;
      //render table data
      var tableData = "";
      for(var x=0; x < data.length; x++)
      {
         var trclass = '';
         if (x % 2 == 0)
         {
            trclass = 'accountHistory-even';
         }
         else
         {
            trclass = 'accountHistory-odd';
         }
         
         tableData = tableData + "<tr id='historyZimlet"+x+"' onclick='ZaAccountHistoryTab.prototype.setSelected(\""+data[x].oip+"\",\""+btoa(data[x].raw)+"\",\""+btoa(data[x].ua)+"\",\"historyZimlet"+x+"\")' class='"+trclass+"'>"+
         "<td class='accountHistory-td' style='width:120px'>"+DOMPurify.sanitize(data[x].date)+"</td>"+
         "<td class='accountHistory-td' style='width:200px'>"+DOMPurify.sanitize(data[x].oip)+"</td>"+
         "<td class='accountHistory-td' style='width:60px'>"+DOMPurify.sanitize(data[x].protocol)+"</td>"+
         "</td></tr>";
      }
     
      var html = '';
      
      html = "<div style='width:800px; height: 600px;'><table id='historyZimletTable'><thead><tr class='accountHistory-odd'><th class='accountHistory-td'>Date</th><th class='accountHistory-td'>IP</th><th class='accountHistory-td'>Protocol</th></tr></thead>"+tableData+"</table><div id='historyZimletDetails'></div>";
      
      ZaAccountHistoryTab.prototype.status(html);

      var yourTable = document.getElementById('historyZimletTable');
      longtable(yourTable, {perPage:10});      
};  

ZaAccountHistoryTab.prototype.status = function (statusText) {
   document.getElementById('AccountHistory-status').innerHTML = statusText;
};

ZaAccountHistoryTab.prototype.setSelected = function (ip, raw, ua, domId) {
   document.getElementById('historyZimletDetails').innerHTML = '<iframe id="historyZimletMap" style="border: 0;" src="" width="800" height="300" frameborder="0" allowfullscreen="allowfullscreen"></iframe><small><pre><b>User Agent:</b><br>'+DOMPurify.sanitize(atob(ua))+'</pre></small>';
   console.log(DOMPurify.sanitize(atob(raw)));
   
   var oldSelected = document.getElementsByClassName('accountHistory-selected');
   for (var i = 0; i < oldSelected.length; ++i) 
   {
      var item = oldSelected[i];     
      if (item.id.substring(13) % 2 == 0)
      {
         item.className = 'accountHistory-even';
      }
      else
      {
         item.className = 'accountHistory-odd';
      }
   }
   
   document.getElementById(domId).className = "accountHistory-selected";
   var soapDoc = AjxSoapDoc.create("AccountHistoryAdmin", "urn:AccountHistoryAdmin", null);
   soapDoc.getMethod().setAttribute("action", "geoIpLookup");
   soapDoc.getMethod().setAttribute("ip", ip);
   var csfeParams = new Object();
   csfeParams.soapDoc = soapDoc;
   csfeParams.asyncMode = true;
   csfeParams.callback = new AjxCallback(ZaAccountHistoryTab.prototype.displayIpLookup);
   var reqMgrParams = {} ;
   resp = ZaRequestMgr.invoke(csfeParams, reqMgrParams);
};

ZaAccountHistoryTab.prototype.displayIpLookup = function (response) {
   response = response._data.Body.AccountHistoryAdminResponse.content[0].geoIpResult;
   response = response.split(", ");
   var OSMBbox = 0.03;
   var minlong = parseFloat(response[7]) - OSMBbox;
   var minlat  = parseFloat(response[6]) - OSMBbox;
   var maxlong = parseFloat(response[7]) + OSMBbox;
   var maxlat  = parseFloat(response[6]) + OSMBbox;   
   //document.getElementById('historyZimletMap').src="https://www.bing.com/maps/embed/viewer.aspx?v=3&cp="+response[6]+"~"+response[7]+"&w=800&h=300&lvl=12&sty=r&typ=d&pp=&ps=&dir=0&mkt=nl-nl&src=SHELL&form=BMEMJS";
   document.getElementById('historyZimletMap').src="https://www.openstreetmap.org/export/embed.html?bbox="+minlong+"%2C"+minlat+"%2C"+maxlong+"%2C"+maxlat;
};


