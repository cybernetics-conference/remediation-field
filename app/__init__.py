import json
import random
from .db import DB
from .monuments import compute_monuments_state
from .pp import compute_pp_state
from flask import Flask, request, jsonify, redirect, render_template
from flask_cors import CORS
from .params import MONUMENT_NAMES, TOPICS
from colorhash import ColorHash
from collections import defaultdict
from .planets import name_from_id

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
CORS(app)
db = {
    table: DB(table)
    for table in ['checkouts']
}
LIBRARY = json.load(open('data/library.json', 'r'))

# add missing topics as 0
for id, book in LIBRARY['books'].items():
    for t in TOPICS:
        book['topics'][t] = book['topics'].get(t, 0)


def get_questions(id):
    book = LIBRARY['books'][id]
    questions = book.get('questions')

    # if no questions for this book,
    # get questions for its topics
    if questions is None:
        topics = book['topics']
        questions = []
        for t in topics:
            questions.extend(LIBRARY['questions'][t])
    return questions


def sum_dicts(*dicts):
    sum = defaultdict(int)
    for d in dicts:
        for k, v in d.items():
            sum[k] += v
    return sum


def mix_topics(*topic_mixtures):
    """compute aggregate topic mixture"""
    topic_mixture = sum_dicts(*topic_mixtures)
    total = sum(topic_mixture.values())
    if total == 0:
        total = 1
    return {t: v/total for t, v in topic_mixture.items()}


@app.route('/checkout/<id>', methods=['POST', 'GET'])
def checkout(id):
    if request.method == 'GET':
        return render_template('book.html', id=id)
        #return redirect("http://www.example.com?id=" + id, code=302)
    else:
        """records a checkout for a attendee and station"""
        # save new book ids
        data = request.get_json()
        db['checkouts'].append({
            'book_id': id,
            'attendee_id': data['attendee_id'],
            'station_id': data['station_id'],
            'timestamp': data['timestamp']
        })

        if(id) in LIBRARY['books']:
            # return book info
            book = LIBRARY['books'][id]
            return jsonify(**book)


@app.route('/book/<id>', methods=['GET'])
def book(id):
    if(id) in LIBRARY['books']:
        # return book info
        book = LIBRARY['books'][id]
        return jsonify(**book)


@app.route('/checkouts')
def checkouts():
    """return all checkouts"""
    checkouts = []
    for c in db['checkouts'].all():
        book_id = c['book_id']
        book = LIBRARY['books'][book_id]
        c['topics'] = book['topics']
        c['title'] = book['title']
        checkouts.append(c)
    return jsonify(checkouts=checkouts)


@app.route('/planets/<id>')
def planet(id):
    """returns attendee checkout planet info"""
    # get topic mixtures for books attendee has checked out
    checkouts = []
    topic_mixtures = []
    for checkout in db['checkouts'].all():
        if checkout['attendee_id'] == id:
            book_id = checkout['book_id']
            book = LIBRARY['books'][book_id]
            topic_mixture = book['topics']
            topic_mixtures.append(topic_mixture)
            checkout['topics'] = book['topics']
            checkout['title'] = book['title']
            checkouts.append(checkout)

    color = ColorHash(id)
    topic_mixture = mix_topics(*topic_mixtures)
    return jsonify(
        color=color.hex,
        checkouts=checkouts,
        topic_mixture=topic_mixture,
        name=name_from_id(id)
    )

@app.route('/planets')
def planets():
    """returns checkout planet info for all attendees"""
    planets = defaultdict(lambda: {'topic_mixture': [], 'checkouts': 0})
    for checkout in db['checkouts'].all():
        book_id = checkout['book_id']
        topic_mixture = LIBRARY['books'][book_id]['topics']
        planets[checkout['attendee_id']]['topic_mixture'].append(topic_mixture)
        planets[checkout['attendee_id']]['checkouts'] += 1

    for id, d in planets.items():
        d['topic_mixture'] = mix_topics(*d['topic_mixture'])
        d['color'] = ColorHash(id).hex
        d['name'] = name_from_id(id)
    return jsonify(**planets)


@app.route('/planet/<planetid>')
def planet_page(planetid):
    """forward to planet page because badge QR codes have this URL embedded in them """
    return render_template('planet.html', planetid=planetid)


@app.route('/plots')
def plots():
    """returns checkout planet info for all attendees"""
    plots = defaultdict(lambda: {'topic_mixture': [], 'checkouts': 0})
    for checkout in db['checkouts'].all():
        book_id = checkout['book_id']
        topic_mixture = LIBRARY['books'][book_id]['topics']
        plots[checkout['attendee_id']]['topic_mixture'].append(topic_mixture)
        plots[checkout['attendee_id']]['checkouts'] += 1

    for id, d in plots.items():
        d['topic_mixture'] = mix_topics(*d['topic_mixture'])
        d['color'] = ColorHash(id).hex
        d['name'] = name_from_id(id)
    return jsonify(**plots)


@app.route('/plot/<plotid>')
def plot_page(plotid):
    """forward to plot page because plot QR codes have this URL embedded in them """
    return render_template('plot.html', plotid=plotid)







@app.route('/books')
def books():
    """returns checked-out book ids"""
    return jsonify(checkouts=list(db['checkouts'].all()))


@app.route('/question')
def question():
    """returns a question based on what has been checked out"""
    questions = []
    for id in set([c['book_id'] for c in db['checkouts'].all()]):
        book = LIBRARY['books'][id]
        qs = get_questions(id)
        questions.extend([{
            'title': book['title'],
            'topics': book['topics'],
            'book_id': id,
            'question': q
        } for q in qs])
    if questions:
        question = random.choice(questions)
    else:
        question = {'question': 'Hmm...', 'title': None}
    return jsonify(question=question)


@app.route('/questions/<id>')
def questions(id):
    """returns questions given a book id"""
    questions = get_questions(id)
    return jsonify(questions=questions)


@app.route('/monuments')
def monuments():
    state = db['monuments'].last()
    if state is None:
        state = compute_monuments_state([])
    return jsonify(state=state, names=MONUMENT_NAMES)


@app.route('/pp', methods=['GET'])
def pp():
    mstate = db['monuments'].last()
    if mstate is None:
        mstate = compute_monuments_state([])
    pp_state = compute_pp_state(mstate)
    return jsonify(**pp_state)

