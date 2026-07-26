function calcGWA(response) {
    let totalUnits = 0;
    let totalWeightedGrades = 0;

    if (response && response.data) {
        response.data.forEach(item => {
            const grade = parseFloat(item.Grade);
            const units = parseFloat(item.Units);
            if (!isNaN(grade) && !isNaN(units)) {
                totalUnits += units;
                totalWeightedGrades += grade * units;
            }
        });
    }

    if (totalUnits === 0) return "N/A";
    const GWA = totalWeightedGrades / totalUnits;
    return GWA.toFixed(4);
}


document.addEventListener('DOMContentLoaded', () => {

    const themeSelect = document.getElementById('themeSelect');
    const body = document.body;


    if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['theme'], (result) => {
            const theme = result.theme || 'minimal';
            body.setAttribute('data-theme', theme);
            if (themeSelect) themeSelect.value = theme;
        });
    }


    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            body.setAttribute('data-theme', newTheme);
            if (chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ theme: newTheme });
            }
        });
    }

    chrome.runtime.sendMessage({ action: "getGrades" }, (response) => {

        if (chrome.runtime.lastError) {
            console.error("Connection error:", chrome.runtime.lastError);
            return;
        }

        const table = document.getElementById('gradeTable');
        const noDataMsg = document.getElementById('noDataMessage');
        const headerTitle = document.getElementById('gradeHeader');
        const tbody = table.querySelector("tbody");

        // Clean up previous GWA display if exists
        const existingGwa = document.querySelector('body > p');
        if (existingGwa) existingGwa.remove();

        if (response && response.data && response.data.length > 0) {
            // Show Table & Header
            table.style.display = '';
            headerTitle.style.display = 'block';
            noDataMsg.style.display = 'none';

            const gwa = calcGWA(response);
            const gwaElement = document.createElement('p');
            gwaElement.textContent = `GWA: ${gwa}`;
            body.appendChild(gwaElement);

            tbody.innerHTML = "";
            response.data.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.Descriptive}</td>
                    <td>${item.Units}</td>
                    <td>${item.Grade}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            // Show Message Only, Hide Header
            table.style.display = 'none';
            headerTitle.style.display = 'none';
            noDataMsg.style.display = 'block';
        }
    });
});