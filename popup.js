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
            if (result.theme) {
                body.setAttribute('data-theme', result.theme);
                if (themeSelect) themeSelect.value = result.theme;
            }
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

        const tbody = document.querySelector("#gradeTable tbody");


        if (!response) {
            tbody.innerHTML = "<tr><td colspan='3' style='text-align:center;'>No response from background script.</td></tr>";
            return;
        }

        const gwa = calcGWA(response);
        const gwaElement = document.createElement('p');
        gwaElement.textContent = `GWA: ${gwa}`;
        body.appendChild(gwaElement);

        if (response.data && response.data.length > 0) {
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
            tbody.innerHTML = "<tr><td colspan='3' style='text-align:center;'>No data found. Please refresh the grades page.</td></tr>";
        }
    });
});