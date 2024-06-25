from bs4 import BeautifulSoup
from pm4py.objects.petri_net.obj import PetriNet
from pm4py.objects.petri_net.utils import petri_utils


def edit_graphvis_svg(filename, pn_dict):
    with open(filename, encoding="utf-8") as f:
        contents = f.read()

    soup = BeautifulSoup(contents, "xml")
    svg = soup.svg
    svg.attrs["width"] = "100%"
    svg.attrs["height"] = "100%"
    svg.attrs["id"] = "prefix"
    graph = svg.g  # Группа с графом

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
