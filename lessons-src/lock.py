"""Portal lock for published lesson decks (2026-10-22, per Sunil).

A deck file copied out of the browser (DevTools, Cache Storage, the network panel) is a
self-contained HTML page that would otherwise play anywhere. lock() puts a tiny script at the
very top of <head>: unless the page is running inside the IGI portal's player (a same-origin
frame of igi-feedback-attendance.vercel.app, or localhost, whose page has loaded
assets/lessons.js), it shows a notice and swallows the rest of the file unparsed - so none of
the slides or scripts run. This stops casual sharing; it is not DRM (someone who edits the
file can remove it).

Applied by upload.py on every publish, and by lock_published.py to decks already live.
The files in dist/ stay unlocked so they can be checked locally in Chrome.
"""
import re

MARK = 'igi-portal-lock-v1'
_HOSTS = r'^(igi-feedback-attendance(-[a-z0-9-]+)?\.vercel\.app|localhost|127\.0\.0\.1)$'
SCRIPT = ('<script id="' + MARK + '">(function(){var ok=false;try{var p=window.parent;'
          'ok=p!==window&&!!p.IGILessons&&/' + _HOSTS.replace('/', '\\/') + '/.test(p.location.hostname)}catch(e){}'
          'if(ok)return;'
          'document.write(\'<style>html,body{margin:0;height:100%;background:#0A1530}</style></head><body>'
          '<div style="display:flex;align-items:center;justify-content:center;height:100%;padding:24px;box-sizing:border-box;'
          'text-align:center;color:#F0D9A6;font:600 22px/1.6 system-ui,-apple-system,Segoe UI,sans-serif">'
          'This IGI presentation opens only inside the IGI School of Gemology portal.</div>'
          '<div style="display:none"><plaintext>\')})();</script>')


def is_locked(html):
    return MARK in html


def lock(html):
    if is_locked(html):
        return html
    m = re.search(r'<head\b[^>]*>', html, re.I)
    if not m:
        raise ValueError('no <head> in deck')
    return html[:m.end()] + SCRIPT + html[m.end():]
