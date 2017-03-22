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
if(appNewUI && ZaSettings){
    if(window.console && window.console.log) console.log("Start loading tk_barrydegraaff_accounthistory_admin.js");
    function ZaAccountHistory() {
        ZaItem.call(this,"ZaAccountHistory");
        this._init();
        this.type = "ZaAccountHistory";
    };
    ZaAccountHistory.prototype = new ZaItem;
    ZaAccountHistory.prototype.constructor = ZaAccountHistory;

    ZaZimbraAdmin._ACCOUNT_HISTORY_VIEW = ZaZimbraAdmin.VIEW_INDEX++;

    ZaApp.prototype.getAccountHistoryViewController =
        function() {
            if (this._controllers[ZaZimbraAdmin._ACCOUNT_HISTORY_VIEW] == null)
                this._controllers[ZaZimbraAdmin._ACCOUNT_HISTORY_VIEW] = new ZaAccountHistoryController(this._appCtxt, this._container);
            return this._controllers[ZaZimbraAdmin._ACCOUNT_HISTORY_VIEW];
        }

    ZaAccountHistory.TreeListener = function (ev) {
        var accountHistory = new ZaAccountHistory();

        if(ZaApp.getInstance().getCurrentController()) {
            ZaApp.getInstance().getCurrentController().switchToNextView(ZaApp.getInstance().getAccountHistoryViewController(),ZaAccountHistoryController.prototype.show, [accountHistory]);
        } else {
            ZaApp.getInstance().getAccountHistoryViewController().show(accountHistory);
        }
    }

    ZaAccountHistory.TreeModifier = function (tree) {
        var overviewPanelController = this ;
        if (!overviewPanelController) throw new Exception("ZaAccountHistory.TreeModifier: Overview Panel Controller is not set.");
        if(ZaSettings.ENABLED_UI_COMPONENTS[ZaSettings.Client_UPLOAD_VIEW] || ZaSettings.ENABLED_UI_COMPONENTS[ZaSettings.CARTE_BLANCHE_UI]) {
            var parentPath = ZaTree.getPathByArray([ZaMsg.OVP_home, ZaMsg.OVP_toolMig]);

            var ti = new ZaTreeItemData({
                parent:parentPath,
                id:ZaId.getTreeItemId(ZaId.PANEL_APP,"magHV",null, "AccountHistoryHV"),
                text: "Account History",
                mappingId: ZaZimbraAdmin._ACCOUNT_HISTORY_VIEW});
            tree.addTreeItemData(ti);

            if(ZaOverviewPanelController.overviewTreeListeners) {
                ZaOverviewPanelController.overviewTreeListeners[ZaZimbraAdmin._ACCOUNT_HISTORY_VIEW] = ZaAccountHistory.TreeListener;
            }
        }
    }

    if(ZaOverviewPanelController.treeModifiers)
        ZaOverviewPanelController.treeModifiers.push(ZaAccountHistory.TreeModifier);

}

