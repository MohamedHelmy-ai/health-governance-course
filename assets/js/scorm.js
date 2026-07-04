var SCORM = {
    api: null,
    
    findAPI: function(win) {
        var attempts = 0;
        while ((win.API_1484_11 == null) && (win.parent != null) && (win.parent != win)) {
            attempts++;
            if (attempts > 100) {
                return null;
            }
            win = win.parent;
        }
        return win.API_1484_11;
    },
    
    init: function() {
        this.api = this.findAPI(window);
        if (this.api == null && window.opener != null && typeof(window.opener) != "undefined") {
            this.api = this.findAPI(window.opener);
        }
        
        if (this.api) {
            var result = this.api.Initialize("");
            if (result.toString() !== "true") {
                console.error("SCORM Initialization failed: " + this.api.GetLastError());
                return false;
            }
            console.log("SCORM 2004 Initialized successfully.");
            return true;
        }
        console.warn("SCORM API not found. Running in standalone mode.");
        return false;
    },
    
    getValue: function(parameter) {
        if (this.api) {
            return this.api.GetValue(parameter);
        }
        return "";
    },
    
    setValue: function(parameter, value) {
        if (this.api) {
            var result = this.api.SetValue(parameter, value);
            if (result.toString() !== "true") {
                console.warn("SCORM SetValue failed for " + parameter + ": " + this.api.GetLastError());
            }
            return result;
        }
        return "false";
    },
    
    commit: function() {
        if (this.api) {
            return this.api.Commit("");
        }
        return "false";
    },
    
    terminate: function() {
        if (this.api) {
            this.api.Terminate("");
            this.api = null;
            console.log("SCORM 2004 Terminated.");
        }
    }
};
