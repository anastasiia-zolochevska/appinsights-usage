import {AppInsights} from "applicationinsights-js"
import away from 'away';
import removeValue from 'remove-value';


var UsageTracker = {

    timespanOfInactivityToExpireSession:1800000,
    windowId : Date.now(),

    init: function(appInsightsOptions){

        if(!window.localStorage) {
            return;
        }

        AppInsights.downloadAndSetup(appInsightsOptions);

        var timer = away(this.timespanOfInactivityToExpireSession);
        
         if(this.allWindowsAreInactive()){
             localStorage.setItem('startSessionTimestamp', Date.now());
         }

        this.markWindowAsActive();
        

        var self = this;

        window.onbeforeunload =  function(){
            self.markWindowAsInactive();
            if(self.allWindowsAreInactive()){
                self.sendSessionMetric(Date.now()-parseInt(localStorage.getItem('startSessionTimestamp')));
            }
        };

        timer.on('idle', function() {
            self.markWindowAsInactive();
            if(self.allWindowsAreInactive()){
                self.sendSessionMetric(Date.now()-parseInt(localStorage.getItem('startSessionTimestamp'))-self.timespanOfInactivityToExpireSession);
            }
        });

        timer.on('active', function() {
            if(self.allWindowsAreInactive()){
                localStorage.setItem('startSessionTimestamp', Date.now());
            }
            self.markWindowAsActive.bind(self)();
        });
        
    },

    allWindowsAreInactive: function(){
        return !localStorage.getItem('activeWindows') || localStorage.getItem('activeWindows').length==0
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
            Math.round(durationInMs/1000),
            1);
        AppInsights.flush();
        //for logging only:
        // localStorage.setItem('Sessions', localStorage.getItem('Sessions')+","+Math.round(durationInMs/1000));
    },
}

export default UsageTracker;