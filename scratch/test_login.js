const fs = require('fs');

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
      headers: { ...self.headers },
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

global.window = {};

const sharedCode = fs.readFileSync('assets/shared.js', 'utf8');
eval(sharedCode);

const gasGet = window.gasGet;

let steps = 0;
function done() {
  if (++steps === 3) {
    console.log('\n--- All login tests finished ---');
    process.exit(0);
  }
}

console.log('Testing Admin login...');
gasGet({
  action: 'counselorLogin',
  name: '__admin__',
  pass: 'IGI2026'
}, (err, res) => {
  if (err || (res && res.status === 'error')) {
    console.error('Admin Login Failed:', err || res);
  } else {
    console.log('Admin Login Success:', res.counselorName, 'Role:', res.authRole, 'isAdmin:', res.isAdmin);
  }
  done();
});

console.log('Testing Counselor Bianca login...');
gasGet({
  action: 'counselorLogin',
  name: 'Bianca',
  pin: 'IGIBianca2026'
}, (err, res) => {
  if (err || (res && res.status === 'error')) {
    console.error('Bianca Login Failed:', err || res);
  } else {
    console.log('Bianca Login Success:', res.counselorName, 'Role:', res.authRole, 'isAdmin:', res.isAdmin);
  }
  done();
});

console.log('Testing Counselor Arpita Master Pin bypass...');
gasGet({
  action: 'counselorLogin',
  name: 'Arpita',
  pin: 'IGIMaster2026'
}, (err, res) => {
  if (err || (res && res.status === 'error')) {
    console.error('Arpita Login Failed:', err || res);
  } else {
    console.log('Arpita Login Success:', res.counselorName, 'Role:', res.authRole, 'isAdmin:', res.isAdmin);
  }
  done();
});
