let prefix;
let markers;
let labelFunction;
let originalNet;
let filesFetched = 0;
const totalDocuments = 4

const conditionColor = "#d0bbff"
const eventActivateColor = "#8de5a1"
const eventCancelColor = "#fffea3"
const defaultColor = "#ffffff"

const slice = new Set()
const activeEvents = new Set()
const cancellableEvents = new Set()
const firedEvents = new Set()

function paintNode(id, color) {
    const node_el = document.querySelector("#node-" + id)
    node_el.setAttribute("fill", color)
}

function setText(id, text) {
    const text_el = document.querySelector("#node-" + id + " text")
    text_el.textContent = text
    let font_size;
    switch (text.length) {
        case 0:
        case 1:
        case 2:
            font_size = 34
            break
        case 3:
            font_size = 30
            break
        case 4:
            font_size = 24
            break
        case 5:
            font_size = 20
            break
        case 6:
            font_size = 16
            break
        case 7:
            font_size = 14
            break
        case 8:
            font_size = 12
            break
        case 9:
            font_size = 11
            break
        case 10:
            font_size = 10
            break
        default:
            font_size = 1
            break
    }
    text_el.setAttribute("font-size", font_size)
}

function addToText(id, toAdd) {
    const text_el = document.querySelector("#node-" + id + " text")
    const prev = parseInt(text_el.textContent || 0)
    setText(id, (prev + toAdd || "") + "")
}

function getActivatedEvents(newConditions) {
    const result = new Set()

    for (const condition of newConditions) {
        const conditionObj = prefix.get(condition)
        for (const event of conditionObj.postset) {
            const eventObj = prefix.get(event)
            let activated = true
            for (const presetCondition of eventObj.preset) {
                if (!slice.has(presetCondition)) {
                    activated = false
                    break
                }
            }
            if (activated) {
                result.add(event)
            }
        }
    }

    return result
}

function recalculateText(affectedConditions) {
    const counter = new Map()
    for (const [conditionId, adding] of affectedConditions) {
        const label = labelFunction.get(conditionId)
        const marker = markers.get(conditionId)

        const sign = adding ? 1 : -1
        if (counter.has(label)) {
            counter.set(label, counter.get(label) + marker * sign)
        } else {
            counter.set(label, marker * sign)
        }
    }

    for (const key of counter.keys()) {
        const val = counter.get(key)
        addToText(key, val)
    }
}

function addToSlice(id) {
    slice.add(id)
    paintNode(id, conditionColor)
}

function removeFromSlice(id) {
    slice.delete(id)
    paintNode(id, defaultColor)
}

function activateEvent(id) {
    activeEvents.add(id)
    cancellableEvents.delete(id)
    paintNode(id, eventActivateColor)
    const transitionId = labelFunction.get(id)
    paintNode(transitionId, eventActivateColor)
}

function deactivateEvent(id) {
    activeEvents.delete(id)
    cancellableEvents.delete(id)
    paintNode(id, defaultColor)
    const transitionId = labelFunction.get(id)
    paintNode(transitionId, defaultColor)
}

function makeEventCancellable(id) {
    activeEvents.delete(id)
    cancellableEvents.add(id)
    paintNode(id, eventCancelColor)
    const transitionId = labelFunction.get(id)
    paintNode(transitionId, defaultColor)
}

function init() {
    const affectedConditions = new Set()

    for (const nodeId of prefix.keys()) {
        const nodeObj = prefix.get(nodeId)
        if (nodeObj.preset.length === 0) {
            addToSlice(nodeId)
            affectedConditions.add([nodeId, true])
        }
    }

    recalculateText(affectedConditions)

    for (const event of getActivatedEvents(slice)) {
        activateEvent(event)
    }
}

function fireEvent(id) {
    firedEvents.add(id)
    const eventObj = prefix.get(id)

    const affectedConditions = new Set()

    for (const condition of eventObj.preset) {
        affectedConditions.add([condition, false])
        removeFromSlice(condition)

        const conditionObj = prefix.get(condition)

        for (const event of conditionObj.preset) {
            deactivateEvent(event)
        }

        for (const event of conditionObj.postset) {
            deactivateEvent(event)
        }
    }

    makeEventCancellable(id)

    const newConditions = new Set()
    for (const condition of eventObj.postset) {
        affectedConditions.add([condition, true])
        newConditions.add(condition)
        addToSlice(condition)
    }

    for (const event of getActivatedEvents(newConditions)) {
        activateEvent(event)
    }

    recalculateText(affectedConditions)
}

function checkCancellable(id) {
    const eventObj = prefix.get(id)

    for (const condition of eventObj.postset) {
        const conditionObj = prefix.get(condition)
        for (const event of conditionObj.postset) {
            if (firedEvents.has(event)) {
                return false
            }
        }
    }

    return true
}


function cancelEvent(id) {
    firedEvents.delete(id)
    const eventObj = prefix.get(id)

    const affectedConditions = new Set()

    for (const condition of eventObj.postset) {
        affectedConditions.add([condition, false])
        removeFromSlice(condition)

        const conditionObj = prefix.get(condition)

        for (const event of conditionObj.postset) {
            deactivateEvent(event)
        }
    }

    const newConditions = new Set()

    for (const condition of eventObj.preset) {
        newConditions.add(condition)
        affectedConditions.add([condition, true])
        addToSlice(condition)

        const conditionObj = prefix.get(condition)
        for (const event of conditionObj.preset) {
            if (checkCancellable(event)) {
                makeEventCancellable(event)
            }
        }
    }

    for (const event of getActivatedEvents(newConditions)) {
        activateEvent(event)
    }

    recalculateText(affectedConditions)
}

function setEventListeners() {
    for (const nodeId of prefix.keys()) {
        const nodeObj = prefix.get(nodeId)
        if (nodeObj.is_place) {
            continue
        }

        const nodeEl = document.querySelector("#node-" + nodeId)
        nodeEl.addEventListener("click", e => {
            if (e.shiftKey) {
                if (activeEvents.has(nodeId)) {
                    fireEvent(nodeId)
                } else if (cancellableEvents.has(nodeId)) {
                    cancelEvent(nodeId)
                }
            }
        })
    }
}

function initPrefix(json) {
    prefix = new Map()

    for (const node of json.nodes) {
        prefix.set(node.id, node)
    }
}

function initMarkers(json) {
    markers = new Map()
    for (const node of json.nodes) {
        markers.set(node.id, node.markers)
    }
}

function initLabelFunction(json) {
    labelFunction = new Map()
    for (const node of json.nodes) {
        labelFunction.set(node.id, node.label)
    }
}

function initOriginalNet(json) {
    originalNet = new Map()

    for (const node of json.nodes) {
        originalNet.set(node.id, node)
    }
}

for (const [initFunc, filename] of [
    [initPrefix, "prefix.json"],
    [initMarkers, "markers.json"],
    [initLabelFunction, "label_function.json"],
    [initOriginalNet, "original_net.json"]
]) {
    fetch(filename).then(response => {
        if (!response.ok) {
            throw new Error("Http Error: " + response.status)
        }
        return response.json()
    }).then(json => {
        initFunc(json)
        filesFetched += 1
        if (filesFetched === totalDocuments) {
            init()
            setEventListeners()
        }
    })
}
