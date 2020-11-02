var gblIgBotUser = {
    user_guid: undefined,
    install_date: new Date(),
    ig_users: [],
    licenses: {},
    actions: [
        { date: '', action: '' }
    ],
    account_growth_stats: [],
    options: {},
    //      whitelist: [],
    //      savedQueue: [{ name: 'q1',date:datetime,queue:[]},{ name: 'q1',date:datetime,queue:[]}]
    init: function() {
        this.user_guid = this.getPref('growbot_user_guid');

        if (!this.user_guid) {
            this.user_guid = this.uuidGenerator();
            this.setPref('growbot_user_guid', this.user_guid);
        }


        // else {
        //     console.log(this.getPref('igBotUser'));
        //     thisFromStorage = JSON.parse(this.getPref('igBotUser'));
        // }

        checkInstallDate();

    },
    uuidGenerator: function() {
        var S4 = function() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    },
    getPref: function(name) {
        var value = localStorage[name];
        if (value == 'false') {
            return false;
        } else {
            return value;
        }
    },
    setPref: function(name, value) {
        localStorage[name] = value;
    },
    saveToLocal: function() {
        localStorage['igBotUser'] = JSON.stringify(gblIgBotUser);
    },
    saveToServer: function() {
        var r2 = new XMLHttpRequest();
        r2.open("PUT", "https://www.growbotforfollowers.com/igBotUser/" + this.user_guid + "/", true);
        r2.setRequestHeader("Content-type", "application/json");
        r2.send(JSON.stringify(this));
    },
    sendToTabs: function() {
        sendMessageToInstagramTabs({ igBotUser: this });
    }
};


var instabot_free_trial_time = 604800000; // 129600000 = 36 hours, 259200000 = 72 hours, 604800000=7 days, 1296000000 = 14 days, 2592000000 = 30 days
var first_run = false;
var todaysdate = new Date();
var today = todaysdate.getTime();
var timeSinceInstall;

chrome.runtime.onInstalled.addListener(installedOrUpdated);

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.query({ url: "https://www.instagram.com/*", currentWindow: true }, tabs => {
        if (tabs.length === 0) {
            alert('Thanks for being a Growbot user! \n\n To use it, click the Growbot icon next to the Instagram logo on instagram.com');
            window.open('https://www.instagram.com/');
        } else {
            for (var i = 0; i < tabs.length; i++) {
                if (tabs[i].active === true) {
                    chrome.tabs.sendMessage(tabs[i].id, { "toggleGrowbot": true, igBotUser: gblIgBotUser });
                }
            }
            // only runs if instagram wasn't the active tab:
            chrome.tabs.update(tabs[0].id, { active: true });
            chrome.tabs.sendMessage(tabs[0].id, { "openGrowbot": true, igBotUser: gblIgBotUser });
        }
    });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    if (request.updatewanted && request.updatewanted == true) {
        gblIgBotUser.init();
    }

    if (request.ig_user) {
        gblIgBotUser.ig_users.push(request.ig_user);
        gblIgBotUser.ig_users = uniq(gblIgBotUser.ig_users);

        if (request.ig_user_account_stats) {
            gblIgBotUser.account_growth_stats.push(request.ig_user_account_stats);
            gblIgBotUser.account_growth_stats = uniq(gblIgBotUser.account_growth_stats);
        }

        gblIgBotUser.saveToLocal();
    }

    if (request.notification) {
        chrome.notifications.create('notification', {
            type: "basic",
            iconUrl: chrome.extension.getURL("icon_128.png"),
            title: "GrowBot",
            message: request.notification
        }, function() {});

    }

    if (request.fnc) {
        window[request.fnc](arguments);
    }

});

//kickoff
//gblIgBotUser.init();



/*****************************************************************************
 * Helper method for making authenticated requests
 *****************************************************************************/

// Helper Util for making authenticated XHRs
function xhrWithAuth(method, url, interactive, callback) {
    var retry = true;
    var access_token;
    getToken();

    function getToken() {
        chrome.identity.getAuthToken({ interactive: interactive }, function(token) {
            if (chrome.runtime.lastError) {
                callback(chrome.runtime.lastError);
                return;
            }
            access_token = token;
            requestStart();
        });
    }

    function requestStart() {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
        xhr.onreadystatechange = function(oEvent) {
            if (xhr.readyState === 4) {
                if (xhr.status === 401 && retry) {
                    retry = false;
                    chrome.identity.removeCachedAuthToken({ 'token': access_token },
                        getToken);
                } else if (xhr.status === 200) {
                    callback(null, xhr.status, xhr.response);
                }
            } else {
                // console.log("(non?)Error - " + xhr.readyState);
            }
        }
        try {
            xhr.send();
        } catch (e) {}
    }
}

function uniq(ar) {
    return Array.from(new Set(ar.map(JSON.stringify))).map(JSON.parse);
}


// function setIcon(partialFilename) {
//     chrome.browserAction.setIcon({ path: "icon48-" + partialFilename + ".png" });
// }

// function saveEnabledStatus(enabledStatus) {
//     chrome.storage.sync.set({ 'igBotEnabled': enabledStatus }, setIcon(enabledStatus));
// }

// function enable() {
//     //console.log('enable was called');
//     sendMessageToActiveTab({ action: 'initFollow' })
// }

// function disable() {
//     //  console.log('disable was called');
//     sendMessageToActiveTab({ action: 'clearAllTimeouts' })
// }

// function allowRedirect(tabId) {
//     var tabObj = getOBjectInArrayByPropertyValue(arrTabs, 'tabId', tabId);

//     if (tabObj.redirected == false) {
//         return true;
//     } else {
//         return false;
//     }
// }

// function getOBjectInArrayByPropertyValue(arr, lookupProp, lookupVal) {
//     for (var i = 0; i < arr.length; i++) {
//         if (arr[i][lookupProp] == lookupVal) {
//             return arr[i];
//         }
//     }
// }

// function modifyObjectInArrayByPropertyValue(arr, lookupProp, lookupVal, propToModify, newVal) {
//     for (var i = 0; i < arr.length; i++) {
//         if (arr[i][lookupProp] == lookupVal) {
//             var newObj = arr[i];
//             newObj[propToModify] = newVal;
//             arr[i] = newObj;
//         }
//     }
// }


// function getStatus(callback) {

//     chrome.storage.sync.get('igBotEnabled', function(object) {

//         var enabled = false;

//         if (typeof object['igBotEnabled'] !== 'undefined') {
//             enabled = object['igBotEnabled'];
//         } else {
//             enabled = false;
//         }

//         callback(enabled);

//     });

// }


// function toggleEnabled(enabled) {

//     if (enabled == true) {
//         disable();
//         saveEnabledStatus(false);
//     } else {
//         enable();
//         saveEnabledStatus(true);
//     }

// }


// function iconClicked() {
//     getStatus(toggleEnabled);
// }

// function sendMessageToActiveTab(message) {
//     chrome.tabs.query({
//         active: true,
//         currentWindow: true
//     }, function(tabs) {
//         chrome.tabs.sendMessage(tabs[0].id, message, function(response) {});

//     });
// }


// saveEnabledStatus(false);
// chrome.browserAction.onClicked.addListener(iconClicked);

// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//         if (request.action == 'disable') {
//             disable();
//             saveEnabledStatus(false);
//         }
//     }
// );
