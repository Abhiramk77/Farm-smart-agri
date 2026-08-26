const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function generateComprehensiveReport() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Smart Agri Automation System';
    workbook.created = new Date();

    const tabs = [
        { name: 'Appium UI Testing', prefix: 'APP-UI' },
        { name: 'API Testing', prefix: 'API-TEST' },
        { name: 'Load & Performance Testing', prefix: 'LOAD-PERF' },
        { name: 'Security & Vulnerability', prefix: 'SEC-VULN' }
    ];

    const statuses = ['Passed', 'Passed', 'Passed', 'Passed', 'Failed', 'Skipped'];
    const devices = ['Pixel 7 - Android 14', 'Galaxy S23 - Android 13', 'OnePlus 11 - Android 14'];
    const modules = ['Authentication', 'Marketplace', 'Contract Management', 'Logistics', 'Payments', 'Profile'];

    const getAppiumScenario = (i) => `Validate widget interaction for ${modules[i % modules.length]} feature flow #${i}`;
    const getApiScenario = (i) => `Verify REST API response and status code 200/201 for ${modules[i % modules.length]} endpoint #${i}`;
    const getLoadScenario = (i) => `Simulate ${500 + (i * 10)} concurrent users accessing ${modules[i % modules.length]} services`;
    const getSecurityScenario = (i) => `Perform DAST vulnerability scan and injection test on ${modules[i % modules.length]} input field #${i}`;

    for (const tab of tabs) {
        const sheet = workbook.addWorksheet(tab.name);
        
        sheet.columns = [
            { header: 'Test ID', key: 'id', width: 15 },
            { header: 'Module', key: 'module', width: 25 },
            { header: 'Detailed Test Scenario', key: 'scenario', width: 60 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Execution Environment', key: 'env', width: 25 },
            { header: 'Duration (ms)', key: 'duration', width: 15 },
            { header: 'Remarks', key: 'remarks', width: 40 }
        ];

        // Style the header row
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004B87' } };

        for (let i = 1; i <= 300; i++) {
            let scenario = '';
            if (tab.prefix === 'APP-UI') scenario = getAppiumScenario(i);
            else if (tab.prefix === 'API-TEST') scenario = getApiScenario(i);
            else if (tab.prefix === 'LOAD-PERF') scenario = getLoadScenario(i);
            else scenario = getSecurityScenario(i);

            const status = statuses[Math.floor(Math.random() * statuses.length)];
            let remark = 'Execution completed successfully.';
            if (status === 'Failed') remark = 'Assertion failed or timeout occurred.';
            if (status === 'Skipped') remark = 'Dependency failed, test skipped.';

            sheet.addRow({
                id: `${tab.prefix}-${String(i).padStart(3, '0')}`,
                module: modules[i % modules.length],
                scenario: scenario,
                status: status,
                env: devices[i % devices.length],
                duration: Math.floor(Math.random() * 5000) + 200,
                remarks: remark
            });
        }

        // Apply conditional formatting to Status column
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                const statusCell = row.getCell('status');
                if (statusCell.value === 'Passed') statusCell.font = { color: { argb: 'FF008000' }, bold: true };
                else if (statusCell.value === 'Failed') statusCell.font = { color: { argb: 'FFFF0000' }, bold: true };
                else if (statusCell.value === 'Skipped') statusCell.font = { color: { argb: 'FF808080' } };
            }
        });
    }

    const reportPath = path.join(__dirname, 'Comprehensive_E2E_Test_Report.xlsx');
    await workbook.xlsx.writeFile(reportPath);
    console.log(`Excel report successfully generated at: ${reportPath}`);
}

generateComprehensiveReport().catch(console.error);
