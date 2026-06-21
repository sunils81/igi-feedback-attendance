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

console.log('Testing getBatchSnapshot...');
gasGet({ action: 'getBatchSnapshot' }, (err, res) => {
  if (err) {
    console.error('getBatchSnapshot error:', err);
  } else {
    console.log('getBatchSnapshot response status:', res ? res.status : null);
    console.log('getBatchSnapshot keys:', res ? Object.keys(res) : null);
    if (res && res.status === 'ok') {
      console.log('Centres count:', res.centres ? res.centres.length : 0);
      if (res.centres && res.centres.length) {
        console.log('First Centre:', JSON.stringify(res.centres[0], null, 2));
      }
    } else {
      console.log('getBatchSnapshot response failed:', res);
    }
  }
});
