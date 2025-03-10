# server.py

from flask import Flask, jsonify, request, render_template
from flask_cors import CORS, cross_origin
from soundgenerator import SoundGenerator

app = Flask(__name__)
cors = CORS(app) # allow CORS for all domains on all routes.
app.config['CORS_HEADERS'] = 'Content-Type'
soundGenerator = SoundGenerator('f','ff_siwis')

@app.route('/tts', methods=['POST'])
def generate_tts():
    identifier = request.json['identifier']
    text = request.json['text']
    result = soundGenerator.generate_text(identifier, text)
    return jsonify(result)

@app.route('/sound', methods=['GET'])
def get_file():
    file_name = request.args.get('filename')
    raw_bytes = ""
    with open('static/sounds/'+file_name, 'rb') as r:
        for line in r:
            raw_bytes = raw_bytes + line
    response = make_response(raw_bytes)
    response.headers['Content-Type'] = "application/octet-stream"
    response.headers['Content-Disposition'] = "inline; filename=" + file_name
    return response

@app.route('/', methods=['GET', 'POST'])
def home():
   return render_template('content.html')


if __name__ == '__main__':
    app.run()