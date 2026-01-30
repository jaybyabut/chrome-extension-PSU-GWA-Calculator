window.addEventListener('GRADES_DATA_READY', (event) => {
    const results = JSON.parse(event.detail);
    chrome.runtime.sendMessage({ 
        type: "SAVE_GRADES", 
        data: results 
    });
});