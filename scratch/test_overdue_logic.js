const fs = require('fs');

// 1. Mock Google Apps Script environment
global.Logger = {
  log: function(...args) {
    console.log('[GAS Logger]', ...args);
  }
};

global.Session = {
  getScriptTimeZone: function() {
    return 'GMT';
  }
};

global.Utilities = {
  formatDate: function(date, tz, format) {
    return date.toISOString().split('T')[0];
  }
};

global.MailApp = {
  sendEmail: function(options) {
    console.log('\n--- EMAIL SENT ---');
    console.log('To:', options.to);
    console.log('CC:', options.cc);
    console.log('Subject:', options.subject);
    console.log('Body length:', options.body ? options.body.length : 0);
    console.log('HTML Body length:', options.htmlBody ? options.htmlBody.length : 0);
    console.log('Sample Row from HTML (first table row):');
    const match = options.htmlBody.match(/<tr[\s\S]*?<\/tr>/g);
    if (match && match.length > 1) {
      console.log(match[1]); // print the first data row
    } else {
      console.log('No table rows found in HTML.');
    }
    console.log('------------------\n');
  }
};

global.CacheService = {
  getScriptCache: function() {
    return {
      get: function() { return null; },
      put: function() {},
      remove: function() {}
    };
  }
};

// Mock SpreadsheetApp
const mockSheet = {
  getLastRow: function() { return 4; },
  getLastColumn: function() { return 41; },
  getRange: function(row, col, numRows, numCols) {
    return {
      getValues: function() {
        // Return 3 rows of student data
        return [
          // Row 1: Student with overdue Installment 1 (due yesterday)
          [
            'STU001', 'John Doe', 'MUM-DG-01', 'Mumbai', 'Diamond Graduate', // col 0-4
            100000, 18000, 118000, 25000, 4500, 29500, // col 5-10
            0, 0, '', 0, 0, 118000, 3, // col 11-17
            30000, new Date(Date.now() - 86400000 * 5).toISOString(), 'N', '', '', '', // col 18-23: Inst 1 (overdue 5 days)
            40000, new Date(Date.now() + 86400000 * 30).toISOString(), 'N', '', '', '', // col 24-29: Inst 2 (future due)
            48000, new Date(Date.now() + 86400000 * 60).toISOString(), 'N', '', '', '', // col 30-35: Inst 3 (future due)
            0, 118000, 'Overdue', 'Admin', '2026-06-14' // col 36-40
          ],
          // Row 2: Student with overdue Installment 2 (due 15 days ago), Installment 1 paid
          [
            'STU002', 'Jane Smith', 'DEL-CSG-02', 'Delhi', 'Colored Stone Graduate',
            100000, 18000, 118000, 25000, 4500, 29500,
            0, 0, '', 0, 0, 118000, 3,
            30000, new Date(Date.now() - 86400000 * 45).toISOString(), 'Y', '2026-05-01', 'Cash', 'REF123', // Inst 1 paid
            40000, new Date(Date.now() - 86400000 * 15).toISOString(), 'N', '', '', '', // Inst 2 overdue 15 days
            48000, new Date(Date.now() + 86400000 * 30).toISOString(), 'N', '', '', '',
            30000, 88000, 'Overdue', 'Admin', '2026-06-14'
          ],
          // Row 3: Student with fully paid fees (no overdue)
          [
            'STU003', 'Bob Johnson', 'CHE-DG-01', 'Chennai', 'Diamond Graduate',
            100000, 18000, 118000, 25000, 4500, 29500,
            0, 0, '', 0, 0, 118000, 3,
            30000, new Date(Date.now() - 86400000 * 15).toISOString(), 'Y', '2026-06-01', 'Card', 'REF456',
            40000, new Date(Date.now() - 86400000 * 5).toISOString(), 'Y', '2026-06-10', 'UPI', 'REF789',
            48000, new Date(Date.now() + 86400000 * 30).toISOString(), 'Y', '2026-06-12', 'UPI', 'REF101',
            118000, 0, 'Paid', 'Admin', '2026-06-14'
          ]
        ];
      }
    };
  }
};

global.SpreadsheetApp = {
  openById: function() {
    return {
      getSheetByName: function(name) {
        if (name === 'Student_Fees') return mockSheet;
        return null;
      }
    };
  }
};

// 2. Load gas.js file content and evaluate it in the global context
const gasCode = fs.readFileSync('backend/gas.js', 'utf8');

// Mock ScriptApp since daily trigger check is run on load of doGet
global.ScriptApp = {
  getProjectTriggers: function() {
    return [];
  },
  newTrigger: function() {
    return {
      timeBased: function() {
        return {
          everyDays: function() {
            return {
              atHour: function() {
                return {
                  create: function() {
                    console.log('[GAS ScriptApp] Trigger dailyOverdueEmailTrigger created successfully.');
                  }
                };
              }
            };
          }
        };
      }
    };
  }
};

eval(gasCode);

// 3. Run test
console.log('Running test verification for sendOverdueFeeEmailNotifications...');
try {
  const result = sendOverdueFeeEmailNotifications();
  console.log('Execution Result:', result);
  console.log('Verification successful!');
} catch (err) {
  console.error('Execution Failed:', err);
  process.exit(1);
}
