let specs;
const svg = document.querySelector("#prefix")
const workspace = document.querySelector("#workspace")

const offset = svg.viewBox.baseVal.width * 0.3;

function applyOffset() {
    let box = svg.viewBox.baseVal
    svg.setAttribute("viewBox",
        (box.x - offset) + " " +
        (box.y - offset) + " " +
        (box.width + 2 * offset) + " " +
        (box.height + 2 * offset)
    )
}

applyOffset()

const global_left = svg.viewBox.baseVal.x
const global_top = svg.viewBox.baseVal.y
const global_width = svg.viewBox.baseVal.width
const global_height = svg.viewBox.baseVal.height

const onkey_move_x = global_width / 20
const onkey_move_y = global_height / 20
const onkey_scale = 0.2

const min_scale = 0.2;
const max_scale = 1;

let current_scale = 1;
let mouse_down = false;
let mouse_position = null;

function clamp_move_x(v) {
    if (v < global_left) {
        return global_left;
    }

    let right = global_left + (1 - current_scale) * global_width
    if (v > right) {
        return right
    }

    return v
}

function clamp_move_y(v) {
    if (v < global_top) {
        return global_top
    }

    let bottom = global_top + (1 - current_scale) * global_height
    if (v > bottom) {
        return bottom
    }

    return v
}

function clamp_scale(v) {
    return Math.max(Math.min(max_scale, v), min_scale)
}

function move(sign_dx, sign_dy) {
    let box = svg.viewBox.baseVal
    svg.setAttribute(
        "viewBox",
        clamp_move_x(box.x + onkey_move_x * sign_dx) + " " +
        clamp_move_y(box.y + onkey_move_y * sign_dy) + " " +
        box.width + " " +
        box.height)
}

function scale(sign, px, py) {
    let box = svg.viewBox.baseVal
    if (current_scale <= min_scale && sign < 0) {
        return
    }

    if (current_scale >= max_scale && sign > 0) {
        return
    }

    let cbox = workspace.getBoundingClientRect();
    if (typeof (px) == "undefined") {
        px = (cbox.left + cbox.right) / 2;
    } else {
        px -= cbox.left;
    }

    if (typeof (py) == "undefined") {
        py = (cbox.top + cbox.bottom) / 2;
    } else {
        py -= cbox.top;
    }


    let old_width = global_width * current_scale
    let old_height = global_height * current_scale
    let old_scale = current_scale
    current_scale = clamp_scale(current_scale + onkey_scale * sign)
    let new_width = global_width * current_scale
    let new_height = global_height * current_scale

    let scaler = current_scale / old_scale

    let dx, dy;
    if (sign < 0) {
        dx = px * (1 / scaler - 1) * new_width / (cbox.right - cbox.left)
        dy = py * (1 / scaler - 1) * new_height / (cbox.bottom - cbox.top)
    } else {
        dx = -(scaler - 1) * px * old_width / (cbox.right - cbox.left)
        dy = -(scaler - 1) * py * old_height / (cbox.bottom - cbox.top)
    }
    svg.setAttribute(
        "viewBox",
        clamp_move_x(box.x + dx) + " " +
        clamp_move_y(box.y + dy) + " " +
        new_width + " " +
        new_height
    )
}

addEventListener("keydown", (event) => {
    if (mouse_down) {
        return
    }
    switch (event.key) {
        case "Down":
        case "ArrowDown":
            move(0, 1)
            break
        case "Up":
        case "ArrowUp":
            move(0, -1)
            break
        case "Left":
        case "ArrowLeft":
            move(-1, 0)
            break
        case "Right":
        case "ArrowRight":
            move(1, 0)
            break
        case "-":
            scale(1)
            break
        case "=":
        case "+":
            scale(-1)
            break
    }
})

addEventListener("wheel", (event) => {  // scaling viewBox using mouse wheel
    if (mouse_down) {
        return
    }
    scale(Math.sign(event.deltaY), event.clientX, event.clientY);
})

addEventListener("mousedown", (event) => {

    if (event.button === 0 && !event.shiftKey) {
        mouse_down = true;
        mouse_position = {x: event.clientX, y: event.clientY}
    }
})

addEventListener("mouseup", (event) => {

    if (event.button === 0) {
        mouse_down = false;
    }
})

addEventListener("mousemove", (event) => {  // move viewBox using mouse drag

    if (!mouse_down) {
        return

    }

    let box = svg.viewBox.baseVal
    let cbox = workspace.getBoundingClientRect();

    let new_width = global_width * current_scale
    let new_height = global_height * current_scale

    let x_cords_transformer = new_width / (cbox.right - cbox.left)
    let y_cords_transformer = new_height / (cbox.bottom - cbox.top)

    // При движении по горизонтали появляется люфт - и я не имею ни малейшего понятия, почему
    // Чтобы это исправить, сдвиг умножается на эмпирически выведенное нечто - скорее всего, не на всех устройствах будет работать((
    let dx = (event.clientX - mouse_position.x) * x_cords_transformer * 1.46
    let dy = (event.clientY - mouse_position.y) * y_cords_transformer

    svg.setAttribute(
        "viewBox",
        clamp_move_x(box.x - dx) + " " +
        clamp_move_y(box.y - dy) + " " +
        box.width + " " +
        box.height
    )
    mouse_position = {x: event.clientX, y: event.clientY}
})


