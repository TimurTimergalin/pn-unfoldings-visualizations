def embed_svg(html_filename, svg):
    with open(html_filename, encoding="utf-8") as f:
        contents = f.read()

    comment = "<!--REPLACE ME-->"

    return contents.replace(comment, svg)
