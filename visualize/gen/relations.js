let prefix;

const selected_color = "#fffea3"
const precede_color = "#d0bbff"
const follow_color = "#fab0e4"
const conflict_color = "#ff5751"
const concurrent_color = "#8de5a1"

function set_after(id, met, color) {
    if (met.has(id)) {
        return
    }
    met.add(id)
    const fill = document.querySelector(".fill-" + id)
    fill.setAttribute("fill", color)
    const cur = prefix.get(id)
    for (let node of cur.postset) {
        set_after(node, met, color)
    }
}

function set_precede(id, from, met) {
    if (met.has(id)) {
        return
    }
    met.add(id)

    const fill = document.querySelector(".fill-" + id)
    fill.setAttribute("fill", precede_color)
    const cur = prefix.get(id)
    if (cur.is_place) {
        for (let child of cur.postset) {
            if (child === from) {
                continue
            }
            set_after(child, met, conflict_color)
        }
    }

    for (let node of prefix.get(id).preset) {
        set_precede(node, id, met)
    }
}

function set_concurrent(met) {
    for (let node of prefix.keys()) {
        if (!met.has(node)) {
            const fill = document.querySelector(".fill-" + node)
            fill.setAttribute("fill", concurrent_color)
        }
    }
}

function set_selected(id) {
    let met = new Set()
    const fill = document.querySelector(".fill-" + id)
    fill.setAttribute("fill", selected_color)

    met.add(id)
    const cur = prefix.get(id)
    for (let child of cur.postset) {
        set_after(child, met, follow_color)
    }

    for (let parent of cur.preset) {
        set_precede(parent, id, met)
    }

    set_concurrent(met)
}

function init_prefix(json) {
    prefix = new Map()

    for (let node of json.nodes) {
        prefix.set(node.id, node)
    }
}

function on_node_click(id) {
    const side_page = document.querySelector("#side-page")
    side_page.style.left = 0
    set_selected(id)
}

function clear_fill() {
    for (let node of prefix.keys()) {
        const fill = document.querySelector(".fill-" + node)
        fill.removeAttribute("fill")
    }
}

fetch("prefix.json").then(response => {
    if (!response.ok) {
        throw new Error("Http Error: " + response.status)
    }
    return response.json()
}).then(json => {
    init_prefix(json)

    for (let node of prefix.keys()) {
        const click = document.querySelector(".click-" + node)
        click.addEventListener("click", (e) => {
            if (e.shiftKey) {
                on_node_click(node)
            }
        })
    }
})

window.oncontextmenu = function () {
    return false
}
