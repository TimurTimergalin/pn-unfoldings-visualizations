import os
from os.path import join

import pm4py

from .edit_graphviz_svg import (edit_graphvis_svg_analyze, edit_graphviz_prefix_svg_interactive,
                                edit_graphviz_original_net_svg_interactive)
from .embed_svg import embed_svg
from .jsonify import jsonify_addition_order, jsonify_net, jsonify_condition_markers, jsonify_label_function


def visualize(net, prefix, events, decorations, directory):
    """
    Генерирует веб-документ с визуализацией развертки сети Петри
    :param net: сеть Петри
    :param prefix: развертка сети net
    :param events: iterable с id событий развертки в том порядке, в котором они были добавлены
    :param decorations: декорации для изображения сети
    :param directory: папка, в которой будут созданы все файлы. Если папки не существует, она будет создана
    """
    os.makedirs(directory, exist_ok=True)

    # Обрабатываем svg
    svg_path = join(directory, "prefix.svg")
    pm4py.save_vis_petri_net(prefix, None, None, svg_path, decorations=decorations)

    edited = edit_graphvis_svg_analyze(svg_path,
                                       {id(x): x for x in prefix.places} | {id(x): x for x in prefix.transitions}
                                       )
    _, _, prefix_svg_analyze = edited.split("\n", 2)

    edited = edit_graphviz_prefix_svg_interactive(svg_path, {id(x) for x in prefix.cutoff_events})
    _, _, prefix_svg_interactive = edited.split("\n", 2)

    os.remove(svg_path)

    svg_path = join(directory, "original_net.svg")
    pm4py.save_vis_petri_net(net, None, None, svg_path)

    edited = edit_graphviz_original_net_svg_interactive(svg_path)
    _, _, original_net_svg_interactive = edited.split("\n", 2)

    os.remove(svg_path)

    # Вставляем json
    for json_path, jsonify_func, *args in [
        ("events.json", jsonify_addition_order, events),
        ("markers.json", jsonify_condition_markers, prefix),
        ("prefix.json", jsonify_net, prefix),
        ("label_function.json", jsonify_label_function, prefix),
        ("original_net.json", jsonify_net, net),
    ]:
        with open(join(directory, json_path), "w", encoding="utf-8") as f:
            f.write(jsonify_func(*args))

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
