pad-visual-media
=============
PAD card image renderer

Requirement
-----------
- Node 8 & Yarn

Usage
-----
```sh
yarn update data/bin  # download image data from server
yarn extract data/bin/mons_4428.bin data/spine  # extract spine data from binary file
yarn render data/spine/mons_4428.json data/vids  # render spine data into mp4 and gif formats
```

Rendering
---------
For simple cards, `yarn extract` output a simple PNG. For animated cards,
`yarn extract` outputs Spine data JSON and atlas data. You can render them
using any Spine-compatible renderer.

You can start up a webserver via `yarn server` which starts at port 8002.

License
-------
MIT