import json
from itertools import chain

from pm4py import PetriNet
from pm4py.objects.petri_net.utils import petri_utils


def jsonify_addition_order(events):
    to_jsonify = {
        "events": [id(x) for x in events]
    }

    return json.dumps(to_jsonify)


def jsonify_condition_markers(pr):
    to_jsonify = {
        "nodes": [
            {
                "id": id(x),
                "markers": x.markers if hasattr(x, "markers") else 1
            }
            for x in pr.places
        ]
    }

    return json.dumps(to_jsonify)


def jsonify_label_function(pr):
    to_jsonify = {
        "nodes": [
            {
                "id": id(x),
                "label": id(x.place if hasattr(x, "place") else x.transition)
            }
            for x in chain(pr.places, pr.transitions)
        ]
    }

    return json.dumps(to_jsonify)


def jsonify_net(pr):
    to_jsonify = {
        "nodes": [
            {
                "id": id(x),
                "is_place": isinstance(x, PetriNet.Place),
                "preset": [id(y) for y in petri_utils.pre_set(x)],
                "postset": [id(y) for y in petri_utils.post_set(x)]
            }
            for x in chain(pr.places, pr.transitions)
        ]
    }

    return json.dumps(to_jsonify)


def jsonify_cutoff_events(pr):
    to_jsonify = {
        "events": [
            id(x) for x in pr.cutoff_events
        ]
    }

    return json.dumps(to_jsonify)