
const chatServerUrl = 'http://localhost:11434'
const ttsServerUrl = 'http://localhost:5000'
const llmmodel = 'phi4';


const ttsServer = {
    generateSpeech: async (identifier, text) => {
        const response = await fetch(`${ttsServerUrl}/tts`, {
            method: 'POST',
            body: JSON.stringify({ identifier: identifier, text: text }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response;
    },
    cleanup: async () => {
        const response = await fetch(`${ttsServerUrl}/cleanup`, {
            method: 'POST',
            body: JSON.stringify({}),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    },
    getSpeechUrl: (itm) => {
        return `${ttsServerUrl}/${itm.filename}`;
    }
}


const chatServer = {
    explain: async (text, callback, done) => {
        const url = `${chatServerUrl}/api/generate`;
        const body = {
            model: llmmodel,
            prompt: "Pretend that You are a master of the French language and know all grammar and sytax rules of it with intention to teach the user of all intricacies of the French language.First of all, translate the provided text, and then translate each word in the text in a separate line. One word per line. Your response is to an english speaking person, therefore it must be in English. Do not provide any text that is not a translation.\nTEXT:" + text,
            stream: true
        }
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        const reader = response.body.getReader();

        while (true) {
            const res = await reader.read();
            if (res.done) {
                break;
            }
            let val = new TextDecoder().decode(res.value, { stream: true });
            let json = JSON.parse(val);
            callback(json.response);
        }
        done();
    },
    correct: async (text, callback, done) => {
        const url = `${chatServerUrl}/api/generate`;
        const body = {
            model: llmmodel,
            prompt: "Pretend that You are a master of the French language and know all grammar and sytax rules of it with intention to teach the user of all intricacies of the French language. Identify the problems with the french text provided in the french text and, if there are any, and concisely explain them in English.\nTEXT:" + text,
            stream: true
        }
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        const reader = response.body.getReader();

        while (true) {
            const res = await reader.read();
            if (res.done) {
                break;
            }
            let val = new TextDecoder().decode(res.value, { stream: true });
            let json = JSON.parse(val);
            callback(json.response);
        }
        done();
    },
    ask: async (text, callback, done) => {
        const url = `${chatServerUrl}/api/generate`;
        const body = {
            model: llmmodel,
            prompt: text,
            stream: true
        }
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        const reader = response.body.getReader();

        while (true) {
            const res = await reader.read();
            if (res.done) {
                break;
            }
            let val = new TextDecoder().decode(res.value, { stream: true });
            let json = JSON.parse(val);
            callback(json.response);
        }
        done();
    }

}


let identifier = (new Date().getTime()).toString() + '_' + Math.floor(Math.random() * 100000000);


let audio = null;
let audioList = {};
let currentlyPlaying = null;

const audioTogglePlay = (audio) => {
    if(!audio) return;
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
}

const audioForward = (audio) => {
    if (!audio) return;
    audio.currentTime += 1;

}

const audioBackwards = (audio) => {
    if (!audio) return;
    if (audio.currentTime > 0) {
        audio.currentTime -= 1;
    }
}

const audioNext = (audio, currentlyPlaying) => {
    if (!audio && !currentlyPlaying && audioList){
        playSpeech(Object.keys(audioList)[0]);
        return;
    }
    let element = document.getElementById(currentlyPlaying).nextSibling;
    let stop = false;
    while (element && !stop) {
        if (element.tagName === 'SPAN' && element.getAttribute('id')) {
            playSpeech(element.getAttribute('id'));
            break;
        } else {
            element = element.nextSibling;
        }
    }
}

const audioPrevious = (audio, currentlyPlaying) => {
    if (!audio) return;
    let element = document.getElementById(currentlyPlaying).previousSibling;
    let stop = false;
    while (element && !stop) {
        if (element.tagName === 'SPAN' && element.getAttribute('id')) {
            playSpeech(element.getAttribute('id'));
            break;
        } else {
            element = element.previousSibling;
        }
    }
}

const audioReset = (audio) => {
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();

}

const toggleDialog = (id) => {
    const dial = document.getElementById(id);
    dial.toggleAttribute('open')
}

const keydownsets = {
    generate: (ev) => {
        if (!ev.shiftKey) return;
        switch (ev.key) {
            case '!':
                document.getElementById('generateBtn').click();
                break;
            case 'E':
                document.getElementById('tts_text').focus();
                break;
        }
    },
    explain: (ev) => {
        if (!ev.shiftKey) return;
        switch (ev.key) {
            case '!':
                document.getElementById('translateBtn').click();
                break;
            case '@':
                document.getElementById('promptBtn').click();
                break;
            case '#':
                document.getElementById('correctBtn').click();
                break;
            case 'E':
                document.getElementById('tutorSource').focus();
                break;
        }
    }
}


let keyDownSet = keydownsets.generate;

window.onkeydown = (ev) => {
    const actElement = window.document.activeElement;
    const skipElements = ['INPUT', 'TEXTAREA'];
    if (skipElements.find(x => x == actElement.tagName)) {
        return;
    }
    if (!ev.shiftKey) return;

    switch (ev.key) {
        case ' ':
            audioTogglePlay(audio);
            break;
        case 'W':
            audioForward(audio);
            break;
        case 'S':
            audioBackwards(audio);
            break;
        case 'Q':
            audioReset(audio);
            break;
        case 'A':
            audioPrevious(audio, currentlyPlaying);
            break;
        case 'D':
            audioNext(audio, currentlyPlaying);
            break;
        case 'G':
            toggleDialog('generationDialog');
            document.getElementById('generateBtn').focus();
            keyDownSet = keydownsets.generate;
            break;
        case 'X':
            ttsServer.cleanup();
            break;
        case 'T':
            const selection = document.getSelection().toString();
            if (selection !== '') {
                text = selection;
            } else {
                text = audioList[currentlyPlaying]?.text;
            }
            if (text && document.getElementById('tutorDialog').getAttribute('open') !== '') {
                explain(text);
            }
            else {
                toggleDialog('tutorDialog');
                document.getElementById('tutorLoading').style.display = 'none';
                document.getElementById('promptBtn').focus();
            }
            keyDownSet = keydownsets.explain;
            break;
        default:
            if (keyDownSet) {
                keyDownSet(ev);
            }
            break;
    }
}

async function generateSpeech() {
    document.getElementById('currentSentence').innerHTML = '';
    document.getElementById('currentAudio').innerHTML = '';
    document.getElementById('generatedText').innerHTML = '';
    currentlyPlaying = null;
    audioList = {};
    audio = null;

    const text = document.getElementById('tts_text').value + '\n';
    document.getElementById('generationDialog').removeAttribute('open');
    document.getElementById('loadingSpace').style.display = 'block';
    const textToGenerate = [];
    let idx = 0;
    const batch = 15;
    const splitters = ['\n', '.', ',', ' '];
    while (idx < text.length) {
        let newIdx = idx + batch;
        if (newIdx > text.length) {
            newIdx = text.length;
        } else {
            for (const splitter of splitters) {
                nidx = text.indexOf(splitter, newIdx);
                if (nidx === -1) continue;
                const diff = nidx - newIdx;
                if (diff < 100) {
                    newIdx = nidx;
                    break;
                }
            }
        }
        textToGenerate.push(text.substring(idx, newIdx + 1));
        idx = newIdx + 1;
    }

    let first = true;
    for (const part of textToGenerate) {
        if (part[part.length - 1] === '\n') identifier = 'p' + identifier;

        const response = await ttsServer.generateSpeech(identifier, part);


        const result = await response.json();
        identifier = (new Date().getTime()).toString() + '_' + Math.floor(Math.random() * 100000000);

        const generationDiv = document.getElementById('generatedText');
        result.forEach((itm, idx) => {
            itm.identifier = itm.identifier + idx.toString();
            if (idx > 0) itm.identifier = itm.identifier.replace('p', '');
            audioList[itm.identifier] = { text: itm.text, identifier: itm.identifier, filename: itm.filename }
            const textElement = document.createElement('span');
            textElement.setAttribute('id', itm.identifier);
            textElement.ondblclick = () => {
                const selection = document.getSelection();
                if (selection?.removeAllRanges) {
                    selection.removeAllRanges();
                }
                playSpeech(itm.identifier);
            }
            textElement.innerText = itm.text + ' ';
            generationDiv.appendChild(textElement);
            if (itm.identifier[0] === 'p') {
                generationDiv.appendChild(document.createElement('br'));
                const space = document.createElement('span');
                space.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;'
                generationDiv.appendChild(space);

            }
            if (first) {
                // playSpeech(itm.identifier);
                // first = false;
            }
        })

    }
    document.getElementById('loadingSpace').style.display = 'none';

}


async function playSpeech(identifier) {
    const itm = audioList[identifier];
    const audioLocation = document.getElementById('currentAudio');
    const audioElement = `<audio controls src="${ttsServer.getSpeechUrl(itm)}" id="currentAudioElement"/>`;
    audioLocation.innerHTML = audioElement;
    audio = document.getElementById('currentAudioElement');

    if (currentlyPlaying) {
        document.getElementById(currentlyPlaying).className = '';
    }
    currentlyPlaying = itm.identifier;
    document.getElementById(currentlyPlaying).className = 'currentlyPlaying';


    const textLocation = document.getElementById('currentSentence');
    textLocation.innerHTML = itm.text;
    audio.play();
}

async function explain(text) {
    document.getElementById('tutorLoading').style.display = 'block';
    document.getElementById('tutorDialog').setAttribute('open', '');
    document.getElementById('tutorSource').value = text;
    const textEl = document.getElementById('tutorText')
    textEl.innerText = '';
    await chatServer.explain(text, (t) => { textEl.innerText += t }, () => document.getElementById('tutorLoading').style.display = 'none');
}
async function ask(text) {
    document.getElementById('tutorLoading').style.display = 'block';
    const textEl = document.getElementById('tutorText')
    textEl.innerText = '';
    await chatServer.ask(text, (t) => { textEl.innerText += t }, () => document.getElementById('tutorLoading').style.display = 'none');
}
async function correct(text) {
    document.getElementById('tutorLoading').style.display = 'block';
    const textEl = document.getElementById('tutorText')
    textEl.innerText = '';
    await chatServer.correct(text, (t) => { textEl.innerText += t }, () => document.getElementById('tutorLoading').style.display = 'none');
}