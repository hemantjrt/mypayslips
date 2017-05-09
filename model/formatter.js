jQuery.sap.require("sap.ui.core.format.NumberFormat");

sap.ui.define([], function() {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue: function(sValue) {
			if (!sValue) {
				return "";
			}
			var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				groupingEnabled: true,
				groupingSeparator: ",",
				decimalSeparator: "."
			});

			return oNumberFormat.format(sValue);
			//return parseFloat(sValue).toFixed(2);
		},
		
		formatPayPeriod: function(oStartdate, oEnddate) {
			return oStartdate + " - " + oEnddate;
		},
		
		
		hideInMobile: function(oIsMobile) {
			return !oIsMobile;
		},
		
		formatAmtDesc: function(oDescLong, oDescShort, oIsMobile) {
			return (oIsMobile) ? oDescShort : oDescLong;
		},
		
		formatTitle: function(oSummEmphasize, oAmount){
			return (oSummEmphasize) ? this.formatter.currencyValue(oAmount) : null;
		},
		
		formatText: function(oSummEmphasize, oAmount){
			return (oSummEmphasize) ? null : this.formatter.currencyValue(oAmount);
		}
	
	};

});