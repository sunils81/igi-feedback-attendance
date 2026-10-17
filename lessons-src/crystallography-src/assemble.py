import sys
n=sys.argv[1]
three=open('/tmp/claude-0/cry/package/build/three.min.js').read()
cx=open('/tmp/claude-0/cry/crystal.js').read()
common=open('/tmp/claude-0/cry/common.html').read()
body=open('/tmp/claude-0/cry/p%s.html'%n).read()
out='<script>\n'+three+'\n</script>\n<script>\n'+cx+'\n</script>\n'+common+'\n'+body
open('/tmp/claude-0/cry/ls/decks/csg-crystallography-%s/scenes.html'%n,'w').write(out)
