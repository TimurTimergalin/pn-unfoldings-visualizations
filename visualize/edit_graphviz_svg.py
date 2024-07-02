from bs4 import BeautifulSoup
from pm4py.objects.petri_net.obj import PetriNet
from pm4py.objects.petri_net.utils import petri_utils


def edit_graphvis_svg_analyze(filename, pn_dict):
    with open(filename, encoding="utf-8") as f:
        contents = f.read()

    soup = BeautifulSoup(contents, "xml")
    svg = soup.svg
    svg.attrs["width"] = "100%"
    svg.attrs["height"] = "100%"
    graph = svg.g  # Группа с графом
    graph.title.extract()

    gs = graph.find_all("g")

    for g in gs:
        hide = g.wrap(soup.new_tag("g"))  # Оборачивание в дополнительный g, нужный для сокрытия элемента

        # Группы для сокрытия включают в себя: событие, условия, следующие за ним, все смежные дуги
        if g["class"] == "node":
            id_ = int(g.title.string)
            click = g.wrap(soup.new_tag("g"))
            click.attrs["class"] = f"click-{id_}"

            node = pn_dict[id_]

            if isinstance(node, PetriNet.Transition):
                hide.attrs["class"] = f"hide-{id_}"
            else:
                preset = petri_utils.pre_set(node)
                if preset:
                    preset, = preset
                    hide.attrs["class"] = f"hide-{id(preset)}"

            # Дополнительный слой для заднего фона
            shape = g.ellipse or g.polygon
            fill = shape.attrs.get("fill")
            fill_wrap = shape.wrap(soup.new_tag("g"))
            shape.attrs["class"] = f"fill-{id_}"
            if fill is not None:
                del shape.attrs["fill"]
                fill_wrap.attrs["fill"] = fill

        else:  # g["class"] == "edge"
            sep = "->"
            from_, to = (int(x) for x in g.title.string.split(sep))
            from_node = pn_dict[from_]
            if isinstance(from_node, PetriNet.Transition):
                hide.attrs["class"] = f"hide-{from_}"
            else:
                hide.attrs["class"] = f"hide-{to}"

        g.title.extract()

    return soup.prettify()


def edit_graphviz_prefix_svg_interactive(filename):
    with open(filename, encoding="utf-8") as f:
        contents = f.read()

    soup = BeautifulSoup(contents, "xml")
    svg = soup.svg
    svg.attrs["width"] = "100%"
    svg.attrs["height"] = "100%"
    graph = svg.g  # Группа с графом
    graph.title.extract()

    gs = graph.find_all("g")

    for g in gs:
        if g["class"] != "node":
            g.title.extract()
            continue
        id_ = int(g.title.string)
        g.title.extract()
        g.attrs["id"] = f"node-{id_}"
        g.attrs["fill"] = "white"
        g.attrs["stroke"] = "black"

        text = g.find("text")
        if text is not None:
            text.attrs["fill"] = "black"
            text.attrs["stroke"] = "none"

        shape = g.ellipse or g.polygon
        if "fill" in shape.attrs:
            del shape.attrs["fill"]
        if "stroke" in shape.attrs:
            del shape.attrs["stroke"]

    return soup.prettify()


def edit_graphviz_original_net_svg_interactive(filename):
    with open(filename, encoding="utf-8") as f:
        contents = f.read()

    soup = BeautifulSoup(contents, "xml")
    svg = soup.svg
    svg.attrs["width"] = "100%"
    svg.attrs["height"] = "100%"
    graph = svg.g  # Группа с графом
    graph.title.extract()

    gs = graph.find_all("g")

    for g in gs:
        if g["class"] != "node":
            g.title.extract()
            continue
        id_ = int(g.title.string)
        g.title.extract()
        g.attrs["id"] = f"node-{id_}"

        shape = g.ellipse or g.polygon
        if "fill" in shape.attrs:
            del shape.attrs["fill"]
        if "stroke" in shape.attrs:
            del shape.attrs["stroke"]
        g.attrs["fill"] = "white"
        g.attrs["stroke"] = "black"

        text = g.find("text")
        if text is not None:
            text.attrs["fill"] = "black"
            text.attrs["stroke"] = "none"

        shape = g.ellipse
        if shape is None:
            continue

        text = g.find("text")
        if text is None:
            text = soup.new_tag("text")
            g.append(text)

        text.attrs["x"] = shape.attrs["cx"]
        # С +3 выглядит просто красивее
        # (почему именно столько - неизвестно)
        text.attrs["y"] = str(float(shape.attrs["cy"]) + 3)
        text.attrs["text-anchor"] = "middle"
        text.attrs["alignment-baseline"] = "middle"
        text.attrs["fill"] = "black"
        text.attrs["stroke"] = "none"
        text.clear()

    return soup.prettify()
