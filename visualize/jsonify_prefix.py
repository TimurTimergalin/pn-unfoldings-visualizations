import json
from itertools import chain

from pm4py.objects.petri_net.utils import petri_utils
from pm4py.objects.petri_net.obj import PetriNet


def jsonify_prefix(pr):
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
