import {AppInsights} from "applicationinsights-js"
import away from 'away';
import removeValue from 'remove-value';


var UsageTracker = {

    timespanOfInactivityToExpireSession:1800000,
    windowId : Date.now(),
    startSessionTimestamp: Date.now(),

    init: function(appInsightsOptions){

        AppInsights.downloadAndSetup(appInsightsOptions);

        var timer = away(this.timespanOfInactivityToExpireSession);

        this.markWindowAsActive();

        var self = this;

        window.onbeforeunload = timer.on('idle', function() {
            self.onCloseOrIdle.bind(self)();
        });

        timer.on('active', function() {
             if(self.allWindowsAreInactive()){
                this.startSessionTimestamp = Date.now();
            }
            self.markWindowAsActive();
        });
        
    },

    onCloseOrIdle: function(){
        this.markWindowAsInactive();
        if(this.allWindowsAreInactive()){
            this.sendSessionMetric(Date.now()-this.startSessionTimestamp-this.timespanOfInactivityToExpireSession);
        }
    },

    allWindowsAreInactive: function(){
        return localStorage.getItem('activeWindows').length==0
    },


    markWindowAsInactive : function(){

        var activeWindows = localStorage.getItem('activeWindows');
        activeWindows = removeValue(activeWindows.split(","), this.windowId.toString()).toString();
        localStorage.setItem('activeWindows', activeWindows);
    },

    markWindowAsActive : function(){
        var activeWindows = localStorage.getItem('activeWindows')? localStorage.getItem('activeWindows') : '';
        activeWindows+="," + this.windowId;
        localStorage.setItem('activeWindows', activeWindows);
    },

    sendSessionMetric: function (durationInMs){
        AppInsights.trackMetric(
            "Session Duration (seconds)", 
            durationInMs/1000,
            1,
            null,
            null,
            {'urlReferrer' : document.referrer});
    },
}

export default UsageTracker;