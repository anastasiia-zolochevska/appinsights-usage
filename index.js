import {AppInsights} from "applicationinsights-js"
import away from 'away';
import removeValue from 'remove-value';


var UsageTracker = {

    timespanOfInactivityToExpireSession:1800000,
    windowId : Date.now(),

    getStorageObject: function(){
        var storage = null;
        var fail;
        var uid;
        try {
            uid = new Date();
            storage = window.localStorage;
            storage.setItem(uid, uid);
            fail = storage.getItem(uid) != uid;
            storage.removeItem(uid);
            if (fail) {
                storage = null;
            }
        } catch (exception) {
            storage = null;
        }

        return storage;
    },
    init: function(appInsightsOptions){
        var storage = this.getStorageObject();
        if(!storage) {
            return;
        }

        AppInsights.downloadAndSetup(appInsightsOptions);

        var timer = away(this.timespanOfInactivityToExpireSession);
        
         if(this.allWindowsAreInactive()){
             storage.setItem('startSessionTimestamp', Date.now());
         }

        this.markWindowAsActive();
        

        var self = this;

        window.onbeforeunload =  function(){
            self.markWindowAsInactive();
            if(self.allWindowsAreInactive()){
                self.sendSessionMetric(Date.now()-parseInt(storage.getItem('startSessionTimestamp')));
            }
        };

        timer.on('idle', function() {
            self.markWindowAsInactive();
            if(self.allWindowsAreInactive()){
                self.sendSessionMetric(Date.now()-parseInt(storage.getItem('startSessionTimestamp'))-self.timespanOfInactivityToExpireSession);
            }
        });

        timer.on('active', function() {
            if(self.allWindowsAreInactive()){
                storage.setItem('startSessionTimestamp', Date.now());
            }
            self.markWindowAsActive.bind(self)();
        });
        
    },

    allWindowsAreInactive: function(){
        return !storage.getItem('activeWindows') || storage.getItem('activeWindows').length==0
    },


    markWindowAsInactive : function(){
        var activeWindows = storage.getItem('activeWindows');
        activeWindows = removeValue(activeWindows.split(","), this.windowId.toString()).toString();
        storage.setItem('activeWindows', activeWindows);
    },

    markWindowAsActive : function(){
        var activeWindows = storage.getItem('activeWindows')? storage.getItem('activeWindows') : '';
        activeWindows+="," + this.windowId;
        storage.setItem('activeWindows', activeWindows);
    },

    sendSessionMetric: function (durationInMs){
        AppInsights.trackMetric(
            "Session Duration (seconds)", 
            Math.round(durationInMs/1000),
            1);
        AppInsights.flush();
        //for logging only:
        // storage.setItem('Sessions', storage.getItem('Sessions')+","+Math.round(durationInMs/1000));
    },
}

export default UsageTracker;