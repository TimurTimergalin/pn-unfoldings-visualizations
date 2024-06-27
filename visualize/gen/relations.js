let prefix;

const selectedColor = "#fffea3"
const precedeColor = "#d0bbff"
const followColor = "#fab0e4"
const conflictColor = "#ff5751"
const concurrentColor = "#8de5a1"

function setAfter(id, met, color) {
    if (met.has(id)) {
        return
    }
    met.add(id)
    const fill = document.querySelector(".fill-" + id)
    fill.setAttribute("fill", color)
    const cur = prefix.get(id)
    for (let node of cur.postset) {
        setAfter(node, met, color)
    }
}

function setPrecede(id, from, met) {
    if (met.has(id)) {
        return
    }
    met.add(id)

    const fill = document.querySelector(".fill-" + id)
    fill.setAttribute("fill", precedeColor)
    const cur = prefix.get(id)
    if (cur.is_place) {
        for (let child of cur.postset) {
            if (child === from) {
                continue
            }
            setAfter(child, met, conflictColor)
        }
    }

    for (let node of prefix.get(id).preset) {
        setPrecede(node, id, met)
    }
}

function setConcurrent(met) {
    for (let node of prefix.keys()) {
        if (!met.has(node)) {
            const fill = document.querySelector(".fill-" + node)
            fill.setAttribute("fill", concurrentColor)
        }
    }
}

function set_selected(id) {
    let met = new Set()
    const fill = document.querySelector(".fill-" + id)
    fill.setAttribute("fill", selectedColor)

    met.add(id)
    const cur = prefix.get(id)
    for (let child of cur.postset) {
        setAfter(child, met, followColor)
    }

    for (let parent of cur.preset) {
        setPrecede(parent, id, met)
    }

    setConcurrent(met)
}

function initPrefix(json) {
    prefix = new Map()

    for (let node of json.nodes) {
        prefix.set(node.id, node)
    }
}

function onNodeClick(id) {
    const sidePage = document.querySelector("#side-page")
    sidePage.style.left = 0
    set_selected(id)
}

function clearFill() {
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
    initPrefix(json)

    for (let node of prefix.keys()) {
        const click = document.querySelector(".click-" + node)
        click.addEventListener("click", (e) => {
            if (e.shiftKey) {
                onNodeClick(node)
            }
        })
    }
})

window.oncontextmenu = function () {
    return false
}
