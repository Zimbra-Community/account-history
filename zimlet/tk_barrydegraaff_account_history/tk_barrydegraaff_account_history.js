/*
 Copyright (C) 2017-2018  Barry de Graaff

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see http://www.gnu.org/licenses/.
 */

function tk_barrydegraaff_account_history_HandlerObject() {
  tk_barrydegraaff_account_history_HandlerObject.settings = {};
  this._appView = void 0;
}

tk_barrydegraaff_account_history_HandlerObject.prototype = new ZmZimletBase();
tk_barrydegraaff_account_history_HandlerObject.prototype.constructor = tk_barrydegraaff_account_history_HandlerObject;
var historyZimlet = tk_barrydegraaff_account_history_HandlerObject;

/**
 * Initialize the context of the OwnCloud zimlet.
 * This method is invoked by Zimbra.
 */
historyZimlet.prototype.init =
  function () {
    // Initialize the zimlet
  };

/**
 * Show a Zimbra Status message (toast notification).
 * @param {string} text The message.
 * @param {number} type The color and the icon of the notification.
 */
historyZimlet.prototype.status =
  function(text, type) {
    var transitions = [ ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.PAUSE, ZmToast.PAUSE, ZmToast.FADE_OUT ];
    appCtxt.getAppController().setStatusMsg(text, type, null, transitions);
  };


/**
 * Called when the panel is double-clicked.
 */
historyZimlet.prototype.doubleClicked =
  function() {
    this.getHistory();
  };

/**
 * Called when the panel is single-clicked.
 */
historyZimlet.prototype.singleClicked =
  function() {
     this.getHistory();
  };

historyZimlet.prototype.getHistory = function() {
      var soapDoc = AjxSoapDoc.create("accountHistory", "urn:accountHistory", null);
      var params = {
         soapDoc: soapDoc,
         asyncMode: true,
         callback:this.displayDialog
      };
      soapDoc.getMethod().setAttribute("action", "getLog");
      appCtxt.getAppController().sendRequest(params);      

};

/* Work-around 8.7.7 regression
*  Bug: https://bugzilla.zimbra.com/show_bug.cgi?id=107013
*  Fix: https://github.com/Zimbra/zm-ajax/pull/5
*/ 
DwtControl.prototype._position =
function(loc) {
      this._checkState();
      var sizeShell = this.shell.getSize();
      var sizeThis = this.getSize();
      var x, y;
      if(sizeThis)
      {
         if (!loc) {
            // if no location, go for the middle
            x = Math.round((sizeShell.x - sizeThis.x) / 2);
            y = Math.round((sizeShell.y - sizeThis.y) / 2);
         } else {
            x = loc.x;
            y = loc.y;
         }
         // try to stay within shell boundaries
         if ((x + sizeThis.x) > sizeShell.x) {
            x = sizeShell.x - sizeThis.x;
         }
         if ((y + sizeThis.y) > sizeShell.y) {
            y = sizeShell.y - sizeThis.y;
         }
         this.setLocation(x, y);
      }
};

/**
 * Display the settings dialog.
 * @param {number} id Dialog ID for the zimlet.
 */
historyZimlet.prototype.displayDialog = function(response) {
      var data = [];
      var length = 0;
      var serverTime = "";
      try
      {
         data = response._data.accountHistoryResponse.content;
         length = response._data.accountHistoryResponse.content.length;
                  
         //https://stackoverflow.com/questions/6427204/date-parsing-in-javascript-is-different-between-safari-and-chrome
         //serverTime = Date.parse(response._data.accountHistoryResponse.serverMeta.time.substring(0,19));
         var a = response._data.accountHistoryResponse.serverMeta.time.substring(0,19).split(/[^0-9]/);
         serverTime=new Date (a[0],a[1]-1,a[2],a[3],a[4],a[5]);
         
         
      }
      catch(err)
      {
         historyZimlet.prototype.status("No data received from server", ZmStatusView.LEVEL_WARNING);
         return;
      }

      //add unix time to log for sorting
      var newData = [];
      for(var x=0; x < length; x++)
      {
         var timeMatches = data[x].logEntry.match(/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] [0-9][0-9]:[0-9][0-9]:[0-9][0-9]/);
         var mTime = data[x].logEntry.match(/,[0-9][0-9][0-9]/);
         //https://stackoverflow.com/questions/6427204/date-parsing-in-javascript-is-different-between-safari-and-chrome
         //newData.push(Date.parse(timeMatches[0])+mTime[0]+" "+data[x].logEntry);
         var a = timeMatches[0].split(/[^0-9]/);
         newData.push(+ new Date (a[0],a[1]-1,a[2],a[3],a[4],a[5], mTime[0].substring(1))+" "+data[x].logEntry);      
      }
      newData.sort();
     // newData.reverse();
      data = newData;
      newData = "";
       
      //parse log with regex     
      for(var x=0; x < length; x++)
      {
         parsed = [];         
         parsed['raw'] = data[x];
         var timeMatches = data[x].match(/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] [0-9][0-9]:[0-9][0-9]:[0-9][0-9]/);
         parsed['date'] = timeMatches[0];

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

      var lessdata={};
      cleandata.forEach(function(element) {
         if(element!=="")
         {
            lessdata[element['oip']+element['protocol']]=element;
         }
      });

      var lessdatafmt=[];
      var x=0;

      for (var key in lessdata) {
      // skip loop if the property is from prototype
      if (!lessdata.hasOwnProperty(key)) continue;
         lessdatafmt[lessdata[key].date]=lessdata[key];
         x++;
      }
      lessdatafmt.sort();
      lessdatafmt.reverse();

      var lessdatafinal=[];
      var x=0;
      var sortedKeys = [];
      for (var key in lessdatafmt) {
      // skip loop if the property is from prototype
      if (!lessdatafmt.hasOwnProperty(key)) continue;
         sortedKeys.push(key);
         x++;
      }    
      sortedKeys.sort();
      sortedKeys.reverse();

      data = lessdatafmt;

      //render table data
      var tableData = "";
      var rowCount = 0;
      sortedKeys.forEach(function(x)
      {
         var trclass = '';
         if (rowCount % 2 == 0)
         {
            trclass = 'accountHistory-even';
         }
         else
         {
            trclass = 'accountHistory-odd';
         }
         if(rowCount == 0)         
         {
            trclass = 'accountHistory-selected';
         }
         
         var timeMatches = data[x].date.match(/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] [0-9][0-9]:[0-9][0-9]:[0-9][0-9]/);

         //https://stackoverflow.com/questions/6427204/date-parsing-in-javascript-is-different-between-safari-and-chrome
         //Date.parse(timeMatches[0]);
         var a = timeMatches[0].split(/[^0-9]/);
         var dateDiff = serverTime - new Date (a[0],a[1]-1,a[2],a[3],a[4],a[5]);
         
         var failedAuth = data[x].raw.match(/invalid password|authentication fail/gm);
         var failedAuthIcon = "";

         if(failedAuth)
         {
            failedAuthIcon = '<div class="ImgWarning" style="float:right" title="Authentication failure"></div>';
         }
         
         tableData = tableData + "<tr id='historyZimlet"+rowCount+"' onclick='historyZimlet.prototype.setSelected(\""+data[x].oip+"\",\""+btoa(data[x].raw)+"\",\""+btoa(data[x].ua)+"\",\"historyZimlet"+rowCount+"\")' class='"+trclass+"'>"+
         "<td class='accountHistory-td' style='width:120px' title='"+DOMPurify.sanitize(data[x].date)+"'>"+historyZimlet.prototype.timeSince(dateDiff)+" ago"+"</td>"+
         "<td class='accountHistory-td' style='width:200px'>"+DOMPurify.sanitize(data[x].oip)+"</td>"+
         "<td class='accountHistory-td' style='width:60px'>"+DOMPurify.sanitize(data[x].protocol)+failedAuthIcon+"</td>"+
         "</td></tr>";
         rowCount++;
      });
     
      var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_account_history').handlerObject;
      
      zimletInstance._dialog = new ZmDialog({
         title: "Account History",
         parent: zimletInstance.getShell(),
         standardButtons: [DwtDialog.OK_BUTTON],
         disposeOnPopDown: true
      });
      var html = '';
      
      html = "<div style='width:800px; height: 600px;'><table id='historyZimletTable'><thead><tr class='accountHistory-odd'><th class='accountHistory-td'>When</th><th class='accountHistory-td'>From what IP</th><th class='accountHistory-td'>From what device or protocol</th></tr></thead>"+tableData+"</table><div id='historyZimletDetails'></div>";
      
      zimletInstance._dialog.setContent(html);
      
      var yourTable = document.getElementById('historyZimletTable');
      longtable(yourTable, {perPage:8});
      
      var contents = document.getElementById('historyZimletTable').innerHTML;
      var select = contents.substring(contents.indexOf('historyZimlet')+13, contents.indexOf('historyZimlet')+14);
      try {
      var el = document.getElementById('historyZimlet'+select);
      el.onclick();
      } catch (err) {}
      
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance.cancelBtn));
      zimletInstance._dialog.setEnterListener(new AjxListener(zimletInstance, zimletInstance.cancelBtn));    
      zimletInstance._dialog._setAllowSelection();
      document.getElementById(zimletInstance._dialog.__internalId+'_handle').style.backgroundColor = '#eeeeee';
      document.getElementById(zimletInstance._dialog.__internalId+'_title').style.textAlign = 'center';
      zimletInstance._dialog.popup();
  };

historyZimlet.prototype.setSelected = function (ip, raw, ua, domId) {
   document.getElementById('historyZimletDetails').innerHTML = '<iframe id="historyZimletMap" style="border: 0;" src="" width="800" height="300" frameborder="0" allowfullscreen="allowfullscreen"></iframe><small><b>Details:</b><br>'+DOMPurify.sanitize(atob(raw))+'</small>';

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
   var soapDoc = AjxSoapDoc.create("accountHistory", "urn:accountHistory", null);
   var params = {
      soapDoc: soapDoc,
      asyncMode: true,
      callback:this.displayIpLookup
   };
   soapDoc.getMethod().setAttribute("action", "geoIpLookup");
   soapDoc.getMethod().setAttribute("ip", ip);
   appCtxt.getAppController().sendRequest(params);   
}

historyZimlet.prototype.displayIpLookup = function (response) {
   response = response._data.accountHistoryResponse.content[0].geoIpResult;
   response = response.split(", ");
   var OSMBbox = 0.03;
   var minlong = parseFloat(response[7]) - OSMBbox;
   var minlat  = parseFloat(response[6]) - OSMBbox;
   var maxlong = parseFloat(response[7]) + OSMBbox;
   var maxlat  = parseFloat(response[6]) + OSMBbox;
   //document.getElementById('historyZimletMap').src="https://www.bing.com/maps/embed/viewer.aspx?v=3&cp="+response[6]+"~"+response[7]+"&w=800&h=300&lvl=12&sty=r&typ=d&pp=&ps=&dir=0&mkt=nl-nl&src=SHELL&form=BMEMJS";
   document.getElementById('historyZimletMap').src="https://www.openstreetmap.org/export/embed.html?bbox="+minlong+"%2C"+minlat+"%2C"+maxlong+"%2C"+maxlat;
}

/* This method is called when the dialog "CANCEL" button is clicked
 */
historyZimlet.prototype.cancelBtn =
  function() {
    try{
      this._dialog.setContent('');
      this._dialog.popdown();
    }
    catch (err) {
    }
  };

historyZimlet.prototype.menuItemSelected =
function(itemId) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_account_history').handlerObject;
   switch (itemId) {
   case "full":
      var soapDoc = AjxSoapDoc.create("accountHistory", "urn:accountHistory", null);
      var params = {
         soapDoc: soapDoc,
         asyncMode: true,
         callback:this.displayDialogFullLog
      };
      soapDoc.getMethod().setAttribute("action", "getLog");
      appCtxt.getAppController().sendRequest(params);
      break;
   }
};

/**
 * Display the settings dialog.
 * @param {number} id Dialog ID for the zimlet.
 */
historyZimlet.prototype.displayDialogFullLog = function(response) {
      var data = [];
      var length = 0;
      try
      {
         data = response._data.accountHistoryResponse.content;
         length = response._data.accountHistoryResponse.content.length;
      }
      catch(err)
      {
         historyZimlet.prototype.status("No data received from server", ZmStatusView.LEVEL_WARNING);
         return;
      }
      
      //add unix time to log for sorting
      var newData = [];
      for(var x=0; x < length; x++)
      {
         var timeMatches = data[x].logEntry.match(/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] [0-9][0-9]:[0-9][0-9]:[0-9][0-9]/);
         var mTime = data[x].logEntry.match(/,[0-9][0-9][0-9]/);
         //https://stackoverflow.com/questions/6427204/date-parsing-in-javascript-is-different-between-safari-and-chrome
         //newData.push(Date.parse(timeMatches[0])+mTime[0]+" "+data[x].logEntry);
         var a = timeMatches[0].split(/[^0-9]/);
         newData.push(+ new Date (a[0],a[1]-1,a[2],a[3],a[4],a[5], mTime[0].substring(1))+" "+data[x].logEntry);
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
         var timeMatches = data[x].match(/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] [0-9][0-9]:[0-9][0-9]:[0-9][0-9]/);
         parsed['date'] = timeMatches[0];

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
         
         tableData = tableData + "<tr id='historyZimlet"+x+"' onclick='historyZimlet.prototype.setSelected(\""+data[x].oip+"\",\""+btoa(data[x].raw)+"\",\""+btoa(data[x].ua)+"\",\"historyZimlet"+x+"\")' class='"+trclass+"'>"+
         "<td class='accountHistory-td' style='width:120px'>"+DOMPurify.sanitize(data[x].date)+"</td>"+
         "<td class='accountHistory-td' style='width:200px'>"+DOMPurify.sanitize(data[x].oip)+"</td>"+
         "<td class='accountHistory-td' style='width:60px'>"+DOMPurify.sanitize(data[x].protocol)+"</td>"+
         "</td></tr>";
      }
     
      var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_account_history').handlerObject;
      
      zimletInstance._dialog = new ZmDialog({
         title: "Account History",
         parent: zimletInstance.getShell(),
         standardButtons: [DwtDialog.OK_BUTTON],
         disposeOnPopDown: true
      });
      var html = '';
      
      html = "<div style='width:800px; height: 600px;'><table id='historyZimletTable'><thead><tr class='accountHistory-odd'><th class='accountHistory-td'>Date</th><th class='accountHistory-td'>IP</th><th class='accountHistory-td'>Protocol</th></tr></thead>"+tableData+"</table><div id='historyZimletDetails'></div>";
      
      zimletInstance._dialog.setContent(html);
      try {
      var el = document.getElementById('historyZimlet0');
      el.onclick();
      } catch (err) {}
      
      var yourTable = document.getElementById('historyZimletTable');
      longtable(yourTable, {perPage:8});
      
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance.cancelBtn));
      zimletInstance._dialog.setEnterListener(new AjxListener(zimletInstance, zimletInstance.cancelBtn));    
      zimletInstance._dialog._setAllowSelection();
      document.getElementById(zimletInstance._dialog.__internalId+'_handle').style.backgroundColor = '#eeeeee';
      document.getElementById(zimletInstance._dialog.__internalId+'_title').style.textAlign = 'center';
      zimletInstance._dialog.popup();
  };

/* https://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site
 */
historyZimlet.prototype.timeSince = function(seconds) {

  seconds = seconds / 1000;

  var interval = Math.floor(seconds / 31536000);

  if (interval > 1) {
    return interval + " years";
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + " months";
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + " days";
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + " hours";
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + " minutes";
  }
  return Math.floor(seconds) + " seconds";
};
