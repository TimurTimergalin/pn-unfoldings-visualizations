const select_mode = document.querySelector("#select-mode")

function onModeSelected(newLocation) {
    select_mode.blur()
    if (newLocation !== undefined) {
        window.location.href = newLocation
    }
}
