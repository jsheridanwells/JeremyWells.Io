# JeremyWells.Io

This is a revamp of my portfolio site at [JeremyWells.io](https://jeremywells.io) 
built with [Jekyll](https://jekyllrb.com/) and borrowing heavily from the 
[Hyde](https://github.com/poole/hyde) and [Plain White](https://github.com/thelehhman/plainwhite-jekyll) themes.

There are three environment settings:

`JEKYLL_ENV=development` will publish files with `draft` set to true.

`JEKYLL_ENV=production` will not publish files with `draft` set to true.

`JEKYLL_ENV=test` will publish all drafts and a few lorum ipsum files that have `test` set to true.

### Some conventions

1. In a post, any `<a href>` with a `.no-target` CSS class will not open in a new tab (for local links).
