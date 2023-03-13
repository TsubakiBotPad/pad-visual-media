pad-visual-media
=============
PAD card image renderer. This used to be a fork of [kiootic/pad-resources](https://github.com/kiootic/pad-resources), we unforked so that we could have issues & codesearch available.

Requirements
-----------
- Node 16 & Yarn

Usage
-----
* `yarn update <bin output directory>` Download raw data from a GH server endpoint.
  * `--server <server>` Server to pull data from (NA, JP, HT, KR) (Required)
  * `--mons <monster_ids>` Comma separated list of monsters to download.  If this and cards are not supplied, download all files.
  * `--cards <card_ids>` Comma separated list of cards to download.  If this and mons are not supplied, download all files.
  * `--new-only` Don't re-download new files.
  * `--use-android` Use android endpoints instead of iOS.
  * `--for-tsubaki` Flag to indicate that this is running for Tsubaki.
  * `--quiet` Don't show progress bars.
* `yarn extract <bin input directory>` Extract images and data from binary files.
  * `--animated-dir <animated output directory>` Place to put raw animated spine files.  If empty, don't process spine files.
  * `--still-dir <still output directory>` Place to put still monster portraits.  If empty, don't process still portrait files.   
  * `--card-dir <card output directory>` Place to put card icon spritesheets.  If empty, don't process cards.   
  * `--new-only` Don't re-download new files.
  * `--for-tsubaki` Flag to indicate that this is running for Tsubaki.
  * `--server` Server to process names for (Tsubaki only)
  * `--quiet` Don't show progress bars.
* `yarn render <spine input directory>` Render spine files.
  * `--animated-dir <animated output directory>` Place to put rendered animated files.  If empty, don't process spine files.
  * `--still-dir <still output directory>` Place to put still monster portraits.  If empty, don't process still portrait files.   
  * `--card-dir <card output directory>` Place to put card icon spritesheets.  If empty, don't process cards.   
  * `--new-only` Don't re-download new files.
  * `--for-tsubaki` Flag to indicate that this is running for Tsubaki.
  * `--server` Server to process names for (Tsubaki only)
  * `--tomb-dir` Place to put animated tombstones (Tsubaki only)
  * `--quiet` Don't show progress bars.

File locations
---------

* `/media/animated_portraits/{}.gif`
* `/media/animated_portraits/{}_hq.gif`
* `/media/animated_portraits/{}.mp4`

License
-------
MIT

Acknowledgements
-------
Many, MANY thanks to kiootic, the author of the original pad-resources library
