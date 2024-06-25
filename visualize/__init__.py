import os
from os.path import join

import pm4py

from .edit_graphviz_svg import edit_graphvis_svg
from .embed_svg import embed_svg
from .jsonify_addition_order import jsonify_addition_order
from .jsonify_prefix import jsonify_prefix


def visualize(prefix, events, decorations, directory):
    os.makedirs(directory, exist_ok=True)

    # Обрабатываем svg
    svg_path = join(directory, "prefix.svg")
    pm4py.save_vis_petri_net(prefix, None, None, svg_path, decorations=decorations)

    edited = edit_graphvis_svg(svg_path,
                               {id(x): x for x in prefix.places} | {id(x): x for x in prefix.transitions}
                               )
    _, _, svg = edited.split("\n", 2)
    os.remove(svg_path)

    # Вставляем json
    events_path = join(directory, "events.json")
    with open(events_path, "w", encoding="utf-8") as f:
        f.write(jsonify_addition_order(events))

    prefix_path = join(directory, "prefix.json")
    with open(prefix_path, "w", encoding="utf-8") as f:
        f.write(jsonify_prefix(prefix))

    # Добавляем файлы в целевую папку
    gen_dir = join(__file__, "..", "gen")
    for file in os.listdir(gen_dir):
        with (
            open(join(gen_dir, file), encoding="utf-8") as inp,
            open(join(directory, file), "w", encoding="utf-8") as out
        ):
            out.write(inp.read())

    # Вставляем svg в html
    html_path = join(directory, "prefix.html")
    embedded = embed_svg(html_path, svg)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(embedded)
