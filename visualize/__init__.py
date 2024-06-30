import os
from os.path import join

import pm4py

from .edit_graphviz_svg import (edit_graphvis_svg_analyze, edit_graphviz_prefix_svg_interactive,
                                edit_graphviz_original_net_svg_interactive)
from .embed_svg import embed_svg
from .jsonify import jsonify_addition_order, jsonify_net, jsonify_condition_markers, jsonify_label_function


def visualize(net, prefix, events, decorations, directory):
    os.makedirs(directory, exist_ok=True)

    # Обрабатываем svg
    svg_path = join(directory, "prefix.svg")
    pm4py.save_vis_petri_net(prefix, None, None, svg_path, decorations=decorations)

    edited = edit_graphvis_svg_analyze(svg_path,
                                       {id(x): x for x in prefix.places} | {id(x): x for x in prefix.transitions}
                                       )
    _, _, prefix_svg_analyze = edited.split("\n", 2)

    edited = edit_graphviz_prefix_svg_interactive(svg_path)
    _, _, prefix_svg_interactive = edited.split("\n", 2)

    os.remove(svg_path)

    svg_path = join(directory, "original_net.svg")
    pm4py.save_vis_petri_net(net, None, None, svg_path)

    edited = edit_graphviz_original_net_svg_interactive(svg_path)
    _, _, original_net_svg_interactive = edited.split("\n", 2)

    os.remove(svg_path)

    # Вставляем json
    events_path = join(directory, "events.json")
    with open(events_path, "w", encoding="utf-8") as f:
        f.write(jsonify_addition_order(events))

    markers_path = join(directory, "markers.json")
    with open(markers_path, "w", encoding="utf-8") as f:
        f.write(jsonify_condition_markers(prefix))

    prefix_path = join(directory, "prefix.json")
    with open(prefix_path, "w", encoding="utf-8") as f:
        f.write(jsonify_net(prefix))

    label_function_path = join(directory, "label_function.json")
    with open(label_function_path, "w", encoding="utf-8") as f:
        f.write(jsonify_label_function(prefix))

    original_net_path = join(directory, "original_net.json")
    with open(original_net_path, "w", encoding="utf-8") as f:
        f.write(jsonify_net(net))

    # Добавляем файлы в целевую папку
    gen_dir = join(__file__, "..", "gen")
    for file in os.listdir(gen_dir):
        with (
            open(join(gen_dir, file), encoding="utf-8") as inp,
            open(join(directory, file), "w", encoding="utf-8") as out
        ):
            out.write(inp.read())

    # Вставляем svg в html
    html_path = join(directory, "analyze.html")
    embedded = embed_svg(html_path, prefix_svg_analyze)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(embedded)

    html_path = join(directory, "interactive.html")
    embedded = embed_svg(html_path, prefix_svg_interactive, 1)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(embedded)

    embedded = embed_svg(html_path, original_net_svg_interactive, 2)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(embedded)
