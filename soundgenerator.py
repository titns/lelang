from kokoro import KPipeline
from IPython.display import display, Audio
import soundfile as sf
import torch
import datetime


class SoundGenerator:
    
    def __init__(self, language, voice):
        self.pipeline = KPipeline(lang_code=language) # <= make sure lang_code matches voice
        self.voice = voice
        
        
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

        

    # text = '''
    # Dominique allume la lampe et s’assoit. Il boit son café. Enfin, il a une idée.
    # Il commence à taper sur son ordinateur portable. Il écrit un scénario pour un film.
    # “Tout est silencieux,” écrit-il. “Le garde de sécurité dort. Les lettres secrètes sont sur le bureau. L’espionne s’approche. Silencieusement, elle —”
    # Boum ! Dominique sursaute. Le café se renverse sur l’ordinateur portable. L’ordinateur cesse de fonctionner. L’écran affiche : “Erreur !”
    # Il y a des lumières vertes et jaunes à l’extérieur de la fenêtre. Des gens applaudissent. La voisine de Dominique fait une fête. C’est une célèbre réalisatrice. Boum ! Un autre feu d’artifice explose dans le jardin de la réalisatrice.
    # '''
    # generator = pipeline(
    #     text, voice='ff_siwis', # <= change voice here
    #     speed=1, split_pattern=r'\n+'
    # )


    # print('started '+ str(datetime.datetime.now()))
    # for i, (gs, ps, audio) in enumerate(generator):
    #     print(i)  # i => index
    #     print(gs) # gs => graphemes/text
    #     print(ps) # ps => phonemes
    #     display(Audio(data=audio, rate=24000, autoplay=i==0))
    #     sf.write(f'{i}.wav', audio, 24000) # save each audio file
    #     print('point: '+ str(datetime.datetime.now()))

    # print('ended: '+ str(datetime.datetime.now()))