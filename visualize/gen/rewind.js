let pnEvents;
let current;
let max;

const restartButton = document.querySelector("#restart")
const previousButton = document.querySelector("#previous")
const nextButton = document.querySelector("#next")
const skipButton = document.querySelector("#skip")

function checkAvailability() {
    restartButton.disabled = current <= 0
    previousButton.disabled = current <= 0
    nextButton.disabled = current >= max
    skipButton.disabled = current >= max
}

function hide(i) {
    const toHide = document.querySelectorAll(".hide-" + pnEvents[i])
    for (let el of toHide) {
        el.setAttribute("visibility", "hidden")
    }
}

function reveal(i) {
    const toReveal = document.querySelectorAll(".hide-" + pnEvents[i])
    for (let el of toReveal) {
        el.setAttribute("visibility", "visible")
    }
}

function restart() {
    for (; current > 0; --current) {
        hide(current - 1)
    }
    checkAvailability()
}

function previous() {
    if (current <= 0) {
        return
    }
    hide(--current)
    checkAvailability()
}

function next() {
    if (current >= max) {
        return
    }
    reveal(current++)
    checkAvailability()
}

function skip() {
    for (; current < max; ++current) {
        reveal(current)
    }
    checkAvailability()
}

fetch("events.json").then(response => {
    if (!response.ok) {
        throw new Error("Http Error: " + response.status)
    }
    return response.json()
}).then(json => {
    if (!Array.isArray(json["events"])) {
        throw new Error("Invalid json")
    }
    pnEvents = json["events"]
    current = max = pnEvents.length

    restartButton.addEventListener("click", restart)
    previousButton.addEventListener("click", previous)
    nextButton.addEventListener("click", next)
    skipButton.addEventListener("click", skip)

    checkAvailability()
})
