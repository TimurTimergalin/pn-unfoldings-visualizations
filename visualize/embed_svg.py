def embed_svg(html_filename, svg, id_=None):
    with open(html_filename, encoding="utf-8") as f:
        contents = f.read()

    comment = f"<!--REPLACE ME{' ' + str(id_) if id_ is not None else ''}-->"

    return contents.replace(comment, svg)
