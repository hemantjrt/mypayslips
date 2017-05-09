/*global location */
sap.ui.define([
	"qldh/mypayslips/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"qldh/mypayslips/model/formatter"
], function(BaseController, JSONModel, formatter) {
	"use strict";

	return BaseController.extend("qldh.mypayslips.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function() {
			var oViewModel = this.getModel("detailView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});

			oShareDialog.open();
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			
			this.getView().byId("iconTabBar").setSelectedKey("AmtSummary");

			this.locModel = new sap.ui.model.json.JSONModel();
			this.locModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
			this.getView().setModel(this.locModel, "localPSModelDet");

			if (!sap.ui.getCore().AppContext) {
				return false;
			}

			if (!sap.ui.getCore().AppContext.oPayslipInfo) {
				return false;
			}

			var oPayslipInfo = sap.ui.getCore().AppContext.oPayslipInfo;

			this.locModel.setData(oPayslipInfo);
			this.locModel.refresh();

			this.pdfPSUrl = this.getModel().sServiceUrl + "/PDFPaystubSet(SeqNum='" + oPayslipInfo.SeqNum + "',PersAssignNum='" + oPayslipInfo.PersAssignNum +
				"')/$value";

			this.getView().byId("BtnFullPS").setVisible(oPayslipInfo.PersAssignNum !== " ");
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.PersAssignNum,
				sObjectName = oObject.PayDate,
				oViewModel = this.getModel("detailView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		onOpenPSHelp: function() {

			var newWindow = window.open("https://streamline.test.health.qld.gov.au/content/help/pay-adv-explained-allstaff.pdf", "_blank");

			// set title window
			newWindow.onload = jQuery.proxy(function() {
				this.setExtWinTitle(newWindow.document, this.getResourceBundle().getText('payslipHelp'));
			}, this);

		},

		onOpenPDF: function() {

			if (!this.pdfPSUrl) {
				return;
			}

			var newWindow = window.open(this.pdfPSUrl, "_blank");

			// set title window
			newWindow.onload = jQuery.proxy(function() {
				this.setExtWinTitle(newWindow.document, this.getResourceBundle().getText('PDFWindowTitle'));
			}, this);

		},

		setExtWinTitle: function(oDocument, oTitle) {
			var timer = setTimeout(function() {
				var head = oDocument.createElement("head");
				oDocument.getElementsByTagName("html")[0].appendChild(head);
				var title = oDocument.createElement("title");
				title.innerText = oTitle;
				oDocument.getElementsByTagName("head")[0].appendChild(title);
				clearTimeout(timer);
			}, 2000);
		}

	});

});