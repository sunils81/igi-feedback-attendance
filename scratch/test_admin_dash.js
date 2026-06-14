const fs = require('fs');

// Mock XMLHttpRequest
global.XMLHttpRequest = function() {
  const self = this;
  this.headers = {};
  this.open = function(method, url) {
    self.method = method;
    self.url = url;
  };
  this.setRequestHeader = function(k, v) {
    self.headers[k] = v;
  };
  this.send = function(body) {
    fetch(self.url, {
      method: self.method,
      headers: { ...self.headers, 'Prefer': self.headers['Prefer'] || 'return=representation' },
      body: body
    }).then(res => {
      self.status = res.status;
      return res.text();
    }).then(text => {
      self.responseText = text;
      if (self.onload) self.onload();
    }).catch(err => {
      if (self.onerror) self.onerror();
    });
  };
};

// Mock document/window
global.window = {};

// Load shared.js
const sharedCode = fs.readFileSync('assets/shared.js', 'utf8');
eval(sharedCode);

const gasGet = window.gasGet;

console.log('Testing getAdminDashboard endpoint...');
gasGet({
  action: 'getAdminDashboard',
  isAdmin: 'true',
  isManager: 'false',
  period: '2026-27',
  fromMonth: '2026-04',
  toMonth: '2027-03'
}, (err, res) => {
  if (err || (res && res.status === 'error')) {
    console.error('getAdminDashboard Failed:', err || res);
    process.exit(1);
  }
  
  console.log('\n--- getAdminDashboard Success ---');
  console.log('Summary:', res.summary);
  console.log('CentreRows count:', res.centreRows ? res.centreRows.length : 0);
  if (res.centreRows && res.centreRows.length) {
    console.log('First CentreRow details:', res.centreRows[0]);
  }
  
  console.log('Fee details exists:', !!res.fee);
  if (res.fee) {
    console.log('Fee National summary:', res.fee.national);
    console.log('Fee Centres count:', res.fee.centres ? res.fee.centres.length : 0);
    console.log('Fee Batches count:', res.fee.batches ? res.fee.batches.length : 0);
  }
  
  console.log('Revenue details exists:', !!res.revenue);
  if (res.revenue) {
    console.log('Revenue MonthlyRows count:', res.revenue.monthlyRows ? res.revenue.monthlyRows.length : 0);
    console.log('Revenue TargetRows count:', res.revenue.targetRows ? res.revenue.targetRows.length : 0);
    console.log('Revenue CentreTargetRows count:', res.revenue.centreTargetRows ? res.revenue.centreTargetRows.length : 0);
    console.log('Revenue CentreStandings count:', res.revenue.centreStandings ? res.revenue.centreStandings.length : 0);
    console.log('Revenue CounsellorStandings count:', res.revenue.counsellorStandings ? res.revenue.counsellorStandings.length : 0);
    if (res.revenue.centreStandings && res.revenue.centreStandings.length) {
      console.log('First CentreStanding:', res.revenue.centreStandings[0]);
    }
  }

  console.log('\nTesting getAcademicHeadDashboard endpoint...');
  gasGet({
    action: 'getAcademicHeadDashboard',
    name: 'Bhavin Patel'
  }, (err2, res2) => {
    if (err2 || (res2 && res2.status === 'error')) {
      console.error('getAcademicHeadDashboard Failed:', err2 || res2);
      process.exit(1);
    }
    
    console.log('\n--- getAcademicHeadDashboard Success ---');
    console.log('Instructor stats count:', res2.instructorStats ? res2.instructorStats.length : 0);
    if (res2.instructorStats && res2.instructorStats.length) {
      console.log('First Instructor stats details:', res2.instructorStats[0]);
    }
    console.log('Comments count:', res2.comments ? res2.comments.length : 0);
    if (res2.comments && res2.comments.length) {
      console.log('First Comment details:', res2.comments[0]);
    }
    console.log('Attendance details exists:', !!res2.attendance);
    console.log('Tests details exists:', !!res2.tests);
    process.exit(0);
  });
});
