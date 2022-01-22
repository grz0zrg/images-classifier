/**
 * Images classifier tool
 * 
 * This allow to filter images fast (move images from a source directory to targets directory) with multiple targets (it is binary by default with 2 targets: keep / discard) from a web interface through keyboard events.
 * The frontend 'index.html' allow to move files fast using keyboard shortcuts, review images by clicking on their preview in the stack viewer and go back into some previous state whenever necessary.
 * The frontend also allow to rotate the image by 90°/180° by clicking on it. (note : just for preview, this doesn't save the change)
 *
 * An arbitrary source directory (containing all images) can be passed as first command-line argument (full path) otherwise a default source directory is chosen : './images'
 * 
 * If you add more targets you must also update index.html key shortcuts so that you can classify images with those targets (see index.html)
 */

const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')
const express = require('express')

const app = express()
const port = 4042

// put any targets here (destination directory)
let targets = ['keep', 'discard']

const args = process.argv
const source_directory = args.length > 2 ? args[2] : `${__dirname}/images`
let files = []

let stack = []

let current_file = -1

let pushing = false
let commiting = false;

targets.forEach((target) => {
    // create target directory if it doesn't exist
    fse.ensureDirSync(path.join(__dirname, target))

    // create stack target route
    app.get(`/${target}`, (req, res) => {
        if (pushing) {
            res.sendStatus(403)
            return
        }
        pushing = true;

        if (current_file === files.length && !files[current_file]) {
            res.sendStatus(404)
        } else {
            stack.push({ target: target, file: files[current_file] })
        
            res.sendStatus(200)
        }

        pushing = false
    })
})

/**
 * scan all source directory files and reset state
 */
const updateFiles = () => {
    files = []

    fs.readdirSync(source_directory).forEach(file => {
        files.push(file)
    });

    current_file = -1
}

updateFiles();

// serve webpage
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname })
})

// send current image file and increase file index
app.get('/image', (req, res) => {
    if ((files.length - 1) > current_file) {
        if (req.query.increase != 'false') {
            current_file += 1
        }

        res.sendFile(files[current_file], { root: source_directory })
    } else {
        // keep the undo state happy
        if ((files.length - 1) >= current_file) {
            current_file += 1
        }

        res.sendStatus(404)
    }
})

// send infos
app.get('/infos', (req, res) => {
    res.json({ remaining: files.length, current_file: files[current_file] })
})

// send current stack content
app.get('/stack', (req, res) => {
    res.json({ stack: stack })
}).put('/stack', (req, res) => {
    if (req.query.index !== undefined && req.query.target !== undefined) {
        const index = parseInt(req.query.index, 10)
        stack[index].target = req.query.target

        res.sendStatus(200);
    } else {
        res.sendStatus(403);
    }
})

// go back; pop stack content and move current file index back
app.get('/undo', (req, res) => {
    if (stack.length && current_file >= 0) {
        stack.pop()

        current_file -= 2

        res.sendStatus(200)
    } else {
        res.sendStatus(403)
    }
})

// in case files need to be updated this route will reset the stack and scan the source directory again
app.get('/reset', (req, res) => {
    stack = []

    updateFiles();

    res.sendStatus(200)
})

// this is the classifier core, it will 'commit' the stack files and actually move the files from source to their respective target
app.get('/commit', (req, res) => {
    if (commiting) {
        commiting = false

        res.sendStatus(403)
    
        return;
    }

    commiting = true;

    let last_file = '';

    // move all files from the stack to their respective target (note : it will overwrite if file exist in the target directory)
    stack.forEach((o) => {
        if (last_file !== o.file && o.file) { // we may have duplicate so filter it
            const src_path = path.join(source_directory, o.file)

            try {
                fse.moveSync(src_path, path.join(__dirname, o.target, o.file), { overwrite: true })
            } catch (e) {
                console.log(e)
            }

            last_file = o.file;
        }
    })

    stack = []

    // do a rescan (so we start at index 0 again on next reload)
    updateFiles();

    console.log("Files to classify: ", files.length)

    res.sendStatus(200)

    commiting = false
})

// serve source directory images directly
// note : this use caching
app.use('/images', express.static(source_directory, {
    maxAge: 86400000 * 30
}))

app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`)
    console.log("Files to classify: ", files.length)
})
