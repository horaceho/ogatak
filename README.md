* Simple analysis GUI for [KataGo](https://github.com/lightvector/KataGo) 1.7.0 or higher.
* Graphics modified from [Sabaki](https://github.com/SabakiHQ/Sabaki), with thanks. Concept borrowed from [Lizzie](https://github.com/featurecat/lizzie).

![Screenshot](https://user-images.githubusercontent.com/16438795/156058144-1bad6a82-3850-44fb-821f-34e56a1a1f21.png)

## Upsides

* Relatively simple once set up.
* I personally like the aesthetics...
* Has most normal Lizzie-ish features.
* Correctly handles many SGF files that trouble other GUIs, especially handicaps and mid-game board edits.
* No dependencies except Electron, quite easy to run from source, doesn't pull in a zillion npm modules.

## Downsides

* KataGo not included, setup takes at least a minute's effort.
* Not really a full SGF editor (cannot write comments or draw labels).
* Electron-based app, everyone hates these (they're big).

## Performance tip

* The setting to request per-move ownership info from KataGo (see Analysis menu) is rather demanding and you should turn it off if you experience any lag. Alternatively, consider changing the engine report rate from the default 0.1 (which is the most intense) to something else.

## Talk to me

* I can often be found on the [Computer Go Discord](https://discord.com/invite/5vacH5F).
