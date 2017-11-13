MONUMENT_NAMES = {
    'society': 'Monument to Peace and Balance',
    'biology': 'Monument to Flourishing Fauna',
    'architecture': 'Monument to Shelter\'s Hearth',
    'economy': 'Monument to Productive Exchange',
    'technology': 'Monument to Knowledge and Computation',
    'contemplation': 'Monument to Self-Contemplation',
    'play': 'Monument to Play and Cooperation'
}

"""
architecture
art
business
biology
cognition
computation
design
economics
humanities
media
politics
society
systems
science
"""

MONUMENT_TOPICS = {
    'society': {
        'society': 0.5,
        'humanities': 0.15,
        'media': 0.15,
        'art': 0.1
    },
    'economy': {
        'economics': 0.6,
        'politics': 0.15,
        'systems': 0.1,
        'business': 0.15
    },
    'biology': {
        'biology': 0.65,
        'science': 0.2,
        'cognition': 0.05,
        'systems': 0.1
    },
    'architecture': {
        'architecture': 0.7,
        'design': 0.2,
        'art': 0.1
    },
    'technology': {
        'computation': 0.6,
        'cognition': 0.4
    },
    'contemplation': {
        'humanities': 0.5,
        'systems': 0.2
        'cognition': 0.7,
    },
    'play': {
        'society': 0.4,
        'humanities': 0.3,
        'art': 0.5,
    }
}

MONUMENT_GRAPH = {
    'economy': {
        'biology': -0.1
    },
    'biology': {},
    'architecture': {},
    'society': {},
    'technology': {}
}
