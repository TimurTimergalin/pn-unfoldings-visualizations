const sequenceDisplay = document.getElementById("sequence-display")

function onClick() {
    navigator.clipboard.writeText(sequenceDisplay.innerText)
}

sequenceDisplay.addEventListener("click", onClick)