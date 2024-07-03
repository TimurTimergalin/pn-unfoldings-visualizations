let prefix
let markers
let labelFunction
let originalNet
let filesFetched = 0
const totalDocuments = 4

const conditionColor = "#d0bbff"
const eventActivateColor = "#8de5a1"
const eventCancelColor = "#fffea3"
const defaultColor = "#ffffff"
const deadlockColor = "#ff5751"

const slice = new Set()
const activeEvents = new Set()
const cancellableEvents = new Set()
const firedEvents = new Set()

const activeTransitions = new Map()

const eventSequence = []

function setSequenceText() {
    const res = []
    for (const event of eventSequence) {
        const node = document.querySelector("#node-" + event)
        const text = node.querySelector("text").textContent.trim()
        res.push(text)
    }
    const resText = res.join(" -> ")

    const sequenceDisplay = document.querySelector("#sequence-display")
    if (resText.length !== 0) {
        sequenceDisplay.innerText = resText
    } else {
        sequenceDisplay.innerText = "Последовательность пуста"
    }
}

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

function checkDeadlock() {
    if (activeEvents.size !== 0) {
        return
    }
    for (const condition of slice) {
        const place = labelFunction.get(condition)
        const placeObj = originalNet.get(place)
        if (placeObj.postset.length !== 0 && markers.get(condition) !== 0) {
            for (const condition of slice) {
                paintNode(condition, deadlockColor)
            }
            return;
        }
    }
}

function clearDeadlock() {
    for (const condition of slice) {
        paintNode(condition, conditionColor)
    }
}

function activateEvent(id) {
    activeEvents.add(id)

    const transitionId = labelFunction.get(id)
    activeTransitions.set(transitionId, (activeTransitions.get(transitionId) || 0) + 1)

    cancellableEvents.delete(id)
    paintNode(id, eventActivateColor)
    paintNode(transitionId, eventActivateColor)
}

function deactivateEvent(id) {
    const deactivated = activeEvents.delete(id)

    const transitionId = labelFunction.get(id)
    if (deactivated) {
        activeTransitions.set(transitionId, activeTransitions.get(transitionId) - 1)
    }

    cancellableEvents.delete(id)
    paintNode(id, defaultColor)
    if (activeTransitions.get(transitionId) === 0) {
        paintNode(transitionId, defaultColor)
    }
}

function makeEventCancellable(id) {
    const deactivated = activeEvents.delete(id)

    const transitionId = labelFunction.get(id)
    if (deactivated) {
        activeTransitions.set(transitionId, activeTransitions.get(transitionId) - 1)
    }

    cancellableEvents.add(id)
    paintNode(id, eventCancelColor)
    if (activeTransitions.get(transitionId) === 0) {
        paintNode(transitionId, defaultColor)
    }
}

function init() {
    setSequenceText()
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
    eventSequence.push(id)
    setSequenceText()
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
    checkDeadlock()
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
    clearDeadlock()
    firedEvents.delete(id)
    eventSequence.splice(
        eventSequence.findIndex(e => {
            return e === id
        }), 1
    )
    setSequenceText()

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

function reset() {
    for (const node of prefix.keys()) {
        paintNode(node, defaultColor)
    }

    for (const node of originalNet.keys()) {
        paintNode(node, defaultColor)
    }
    slice.clear()
    activeEvents.clear()
    cancellableEvents.clear()
    firedEvents.clear()
    activeTransitions.clear()
    eventSequence.splice(0)

    init()
}

function setEventListeners() {
    for (const nodeId of prefix.keys()) {
        const nodeObj = prefix.get(nodeId)
        const nodeEl = document.querySelector("#node-" + nodeId)

        if (!nodeObj.is_place) {
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

        const activeClass = "active"
        const label = labelFunction.get(nodeId)
        const labelEl = document.querySelector("#node-" + label)
        nodeEl.addEventListener("mouseenter", () => {
            labelEl.classList.add(activeClass)
        })

        nodeEl.addEventListener("mouseleave", () => {
            labelEl.classList.remove(activeClass)
        })

        labelEl.addEventListener("mouseenter", () => {
            nodeEl.classList.add(activeClass)
        })

        labelEl.addEventListener("mouseleave", () => {
            nodeEl.classList.remove(activeClass)
        })

        const resetButton = document.querySelector("#reset")
        resetButton.addEventListener("click", (e) => {
            reset()
        })
    }
}

function initPrefix(json) {
    prefix = new Map()

    for (const node of json.nodes) {
        prefix.set(node.id, node)
    }
}

function initOriginalNet(json) {
    originalNet = new Map()

    for (const node of json.nodes) {
        originalNet.set(node.id, node)
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

