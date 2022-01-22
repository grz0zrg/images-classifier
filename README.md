# images-classifier

Simple images classifier / reviewer driven by keyboard events with web frontend and Node.js backend (put images into target folders based on keyboard events)

This was used to classify (keep / discard) randomized output of [generative art](https://www.onirom.fr/ica.html) / sizecoding graphics program.

This allow to filter images from a source directory to some target directories manually through keyboard. This also allow to review the images through a web frontend before moving them.
It support multiple targets directories with configurable keyboard shortcuts, it is binary by default with two targets: `keep` and `discard`

The frontend 'index.html' allow to move files fast using keyboard shortcuts, review filtered images by clicking on their preview in the stack viewer and go back into some previous state whenever necessary.
The frontend also allow to rotate the image by 90°/180° by clicking on it. (note : this doesn't save the change)

This use page refresh heavily on the frontend side, it is lightweight, fairly fast and simple to hack : any keyboard actions will refresh the page. (all input events are associated to an API route)

Frontend : 

This does not classify files directly but all filtering actions are put into a temporary stack which can be reviewed quickly on the right panel of the frontend, when happy with the stack content the stack can be commited so images will be moved to their respective target directory (so you can quickly check that all is good before moving files), here are the defined actions :

* up arrow key : put image in the stack and mark it as `keep`
* down arrow key : put image in the stack and mark it as `discard`
* left arrow key : go back to a previous stack state (basically undo operation, will unmark last processed image)
* right arrow key : clear the stack; go into the state of the latest commit
* space bar : commit; this will move all files of the stack into their respective directory (note : you can't go back after)

The stack on the right panel can be re-checked by hovering on thumbnails and clicking on it allow to apply different target, the thumbnail border color show the target (by default : green / keep and grey / discard)

Backend :

An arbitrary source directory (containing all images to filter) can be passed as first command-line argument (full path) otherwise a default source directory is chosen (it must exist) : './images'

## usage

* `npm install`
* `node index.js`

open http://localhost:4042 in a browser

## more

More targets (= target directories) and associated events can be added by updating `index.html` `add your targets here` and adding them to `targets` in `index.js`, target directory are created if they don't exist already

Other type of inputs could also be added pretty easily by replacing the code of `keyboard events` by another type of event in `index.html`