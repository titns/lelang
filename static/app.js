
const chatServerUrl = 'http://localhost:11434'
const ttsServerUrl = 'http://localhost:5000'
const llmmodel = 'mistral';


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
    getSpeechUrl: (itm) => {
        return `${ttsServerUrl}/${itm.filename}`;
    }
}


const chatServer = {
    explain: async (text) => {
        const url = `${chatServerUrl}/v1/chat/completions`;
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                model:llmmodel,
                messages: [
                    {
                        role: "system",
                        content: "You are an english language teacher that helpfully translates to a student the french language. The responses You provide are in english language. Each word is explained in a separate line."
                    },
                    {
                        role: "user",
                        content: `${text}`
                    }
                ],
                temperature: 0.8,
                max_tokens: -1,
                stream: false
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const result = await response.json();
        console.log(result);
        return result.choices[0].message.content;
    },
    ask: async (text) => {
        const url = `${chatServerUrl}/v1/chat/completions`;
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                'model': llmmodel,
                messages: [
                    {
                        role: "system",
                        content: "You are an english language teacher that helpfully explains to a student the french language. You try to be concise unless the user asks to explain it in detail. The responses You provide are in english language."
                    },
                    {
                        role: "user",
                        content: `${text}`
                    }
                ],
                temperature: 0.8,
                max_tokens: -1,
                stream: false
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const result = await response.json();
        return result.choices[0].message.content;

    }

}


let identifier = (new Date().getTime()).toString() + '_' + Math.floor(Math.random() * 100000000);


let audio = null;
let audioList = {};
let currentlyPlaying = null;

const audioTogglePlay = (audio) => {
    if (!audio) return;
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
    if (!audio) return;
    let element = document.getElementById(currentlyPlaying).nextSibling;
    let stop = false;
    while (element && !stop) {
        if (element.tagName === 'SPAN') {
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
        if (element.tagName === 'SPAN') {
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


window.onkeydown = (ev) => {
    const actElement = window.document.activeElement;
    const skipElements = ['INPUT','TEXTAREA'];
    if(skipElements.find(x=>x==actElement.tagName)){
        return;
    }
    if (!ev.shiftKey) return;

    switch (ev.key) {
        case 'G':
            toggleDialog('generationDialog');
            break;
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
        case 'T':
            if (currentlyPlaying) {
                explain(audioList[currentlyPlaying]?.text);
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

    const text = document.getElementById('tts_text').value;
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
                    newIdx = nidx + 1;
                    break;
                }
            }
        }
        textToGenerate.push(text.substring(idx, newIdx + 1));
        idx = newIdx;
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
            textElement.onclick = () => playSpeech(itm.identifier);
            textElement.innerText = itm.text + ' ';
            generationDiv.appendChild(textElement);
            if (itm.identifier[0] === 'p') {
                generationDiv.appendChild(document.createElement('br'));
                generationDiv.appendChild(document.createElement('br'));
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
    const result = await chatServer.explain(text);
    console.log(`result is: ${result}`)
    document.getElementById('tutorText').innerText = result;
    document.getElementById('tutorLoading').style.display = 'none';
}
async function ask(text) {
    document.getElementById('tutorLoading').style.display = 'block';
    const result = await chatServer.ask(text);
    document.getElementById('tutorText').value = result;
    document.getElementById('tutorLoading').style.display = 'none';

}