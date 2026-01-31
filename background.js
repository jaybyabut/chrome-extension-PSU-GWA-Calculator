
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.startsWith('http')) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            world: 'MAIN', 
            func: gradeReader
        });
    }
});


function gradeReader() {
    // prevent double runs
    if (window.__API_READER_LOADED__) return;
    window.__API_READER_LOADED__ = true;

    console.log("Reading Grades...");


    const rawOpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method, url) {
        this.addEventListener('load', () => {
            try {
                const response = JSON.parse(this.responseText);
                if (response.list) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.list, 'text/html');
                    const rows = doc.querySelectorAll('table tbody tr');
                    const results = [];

                    rows.forEach(row => {
                        const cols = row.querySelectorAll('td');
                        if (cols.length >= 7) {
                            results.push({
                                Code: cols[1].innerText.trim(),
                                Descriptive: cols[2].innerText.trim(),
                                Units: cols[3].innerText.trim(),
                                Grade: cols[6].innerText.trim(),
                                Remarks: cols[7].innerText.trim()
                            });
                        }
                    });

                    if (results.length > 0) {
                        window.dispatchEvent(new CustomEvent('GRADES_DATA_READY', { 
                            detail: JSON.stringify(results) 
                        }));
                    }
                }
            } catch (e) {}
        });
        return rawOpen.apply(this, arguments);
    };

}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getGrades") {
        chrome.storage.local.get(["interceptedGrades"], (result) => {
            sendResponse({ data: result.interceptedGrades || [] });
        });
        return true; 
    }
    
    if (message.type === "SAVE_GRADES") {
        chrome.storage.local.set({ interceptedGrades: message.data });
        return true; 
    }
});


function checkAndClearData() {
    chrome.tabs.query({ url: "https://sms.dhvsu.edu.ph/*" }, (tabs) => {
        if (tabs.length === 0) {
            console.log("No matching tabs found. clearing data.");
            chrome.storage.local.remove(["interceptedGrades"]);
        }
    });
}

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    checkAndClearData();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the user navigated away in the same tab
    if (changeInfo.status === 'complete' || changeInfo.url) {
        checkAndClearData();
    }
});