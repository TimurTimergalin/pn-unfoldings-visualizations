import json


def jsonify_addition_order(events):
    to_jsonify = {
        "events": [id(x) for x in events]
    }

    return json.dumps(to_jsonify)
