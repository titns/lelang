from kokoro import KPipeline
from IPython.display import display, Audio
import soundfile as sf
import torch
import datetime


class SoundGenerator:
    
    def __init__(self, language, voice):
        self.language=language
        self.voice = voice
        self.pipeline = KPipeline(lang_code=self.language) # <= make sure lang_code matches voice
        
        
    def generate_text(self, identifier, text):
        currtime = datetime.datetime.now();
        generator = self.pipeline(
            text, self.voice,
            speed=1, split_pattern=r'\n+'
        )
        result = []
        for i, (gs, ps, audio) in enumerate(generator):
            print(i)  # i => index
            print(gs) # gs => graphemes/text
            print(ps) # ps => phonemes
            display(Audio(data=audio, rate=24000, autoplay=i==0))
            filename = f'static/sounds/{identifier}_{i}.wav'
            sf.write(filename, audio, 24000) # save each audio file
            result.append({"identifier":identifier, "text":gs, "filename": filename})
            print("{0} in {1}".format(str(len(gs)), str((datetime.datetime.now()-currtime).seconds)))
            currtime = datetime.datetime.now()
        return result