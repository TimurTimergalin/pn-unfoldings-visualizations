let pn_events;
let current;
let max;

const restart_button = document.querySelector("#restart")
const previous_button = document.querySelector("#previous")
const next_button = document.querySelector("#next")
const skip_button = document.querySelector("#skip")

function check_availability() {
    restart_button.disabled = current <= 0
    previous_button.disabled = current <= 0
    next_button.disabled = current >= max
    skip_button.disabled = current >= max
}

function hide(i) {
    const to_hide = document.querySelectorAll(".hide-" + pn_events[i])
    for (let el of to_hide) {
        el.setAttribute("visibility", "hidden")
    }
}

function reveal(i) {
    const to_reveal = document.querySelectorAll(".hide-" + pn_events[i])
    for (let el of to_reveal) {
        el.setAttribute("visibility", "visible")
    }
}

function restart() {
    for (; current > 0; --current) {
        hide(current - 1)
    }
    check_availability()
}

function previous() {
    if (current <= 0) {
        return
    }
    hide(--current)
    check_availability()
}

function next() {
    if (current >= max) {
        return
    }
    reveal(current++)
    check_availability()
}

function skip() {
    for (; current < max; ++current) {
        reveal(current)
    }
    check_availability()
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
    pn_events = json["events"]
    current = max = pn_events.length

    restart_button.addEventListener("click", restart)
    previous_button.addEventListener("click", previous)
    next_button.addEventListener("click", next)
    skip_button.addEventListener("click", skip)

    check_availability()
})
