class ViewBoxController {
    svg;
    workspace;

    globalViewBox;

    currentScale = 1
    mouseDown = false
    fixedPoint = null

    get minScale() {
        return Number.MIN_VALUE
    }

    get maxScale() {
        return 1
    }

    get onKeyMoveX() {
        return this.globalViewBox.width / 100
    }

    get onKeyMoveY() {
        return this.globalViewBox.height / 100
    }

    get onKeyScale() {
        return 0.8
    }

    constructor(workspace) {
        this.workspace = workspace
        this.svg = workspace.querySelector("svg")
        this.setGlobalViewBox()
        this.setControlEvents()

        this.setHoverEvents()
    }

    setControlEvents() {
        const workspace = this.workspace
        workspace.addEventListener("keydown", ev => this.keydownListener(ev))
        workspace.addEventListener("wheel", ev => this.wheelListener(ev))
        workspace.addEventListener("mousedown", ev => this.mousedownListener(ev))
        workspace.addEventListener("mouseup", ev => this.mouseupListener(ev))
        workspace.addEventListener("mousemove", ev => this.mousemoveListener(ev))
    }

    setHoverEvents() {
        const workspace = this.workspace
        this.svg.addEventListener("mouseenter", () => workspace.focus())
        workspace.addEventListener("mouseenter", () => workspace.focus())
        const mouseoutListener = () => {
            workspace.blur()
            workspace.dispatchEvent(new MouseEvent("mouseup"))
        }
        this.svg.addEventListener("mouseleave", mouseoutListener)
        workspace.addEventListener("mouseleave", mouseoutListener)
    }

    setGlobalViewBox() {
        let box = this.svg.viewBox.baseVal

        const objectWidth = box.width
        const objectHeight = box.height

        const boundaryLength = Math.max(objectWidth, objectHeight) * 3

        const globalX = -(boundaryLength - objectWidth) / 2
        const globalY = -(boundaryLength - objectHeight) / 2

        let x, y, width, height

        if (this.workspace.offsetWidth >= this.workspace.offsetHeight) {
            width = boundaryLength;
            height = boundaryLength * this.workspace.offsetHeight / this.workspace.offsetWidth
            x = globalX
            y = globalY + (boundaryLength - height) / 2
        } else {
            height = boundaryLength
            width = boundaryLength * this.workspace.offsetWidth / this.workspace.offsetHeight
            y = globalY
            x = globalX + (boundaryLength - width) / 2
        }

        this.svg.setAttribute("viewBox",
            x + " " +
            y + " " +
            width + " " +
            height
        )

        this.globalViewBox = {
            x: globalX,
            y: globalY,
            left: globalX,
            top: globalY,
            width: boundaryLength,
            height: boundaryLength,
            maxWidth: width,
            maxHeight: height
        }
    }

    clampMoveX(v) {
        const globalLeft = this.globalViewBox.left
        const globalWidth = this.globalViewBox.width
        const maxWidth = this.globalViewBox.maxWidth

        if (v < globalLeft) {
            return globalLeft;
        }

        let right = globalLeft + globalWidth - this.currentScale * maxWidth
        if (v > right) {
            return right
        }

        return v
    }

    clampMoveY(v) {
        const globalTop = this.globalViewBox.top
        const globalHeight = this.globalViewBox.height
        const maxHeight = this.globalViewBox.maxHeight

        if (v < globalTop) {
            return globalTop
        }

        let bottom = globalTop + globalHeight - this.currentScale * maxHeight
        if (v > bottom) {
            return bottom
        }

        return v
    }

    clampScale(v) {
        return Math.min(this.maxScale, Math.max(this.minScale, v))
    }

    move(signDx, signDy) {
        let box = this.svg.viewBox.baseVal
        this.svg.setAttribute(
            "viewBox",
            this.clampMoveX(box.x + this.onKeyMoveX * signDx) + " " +
            this.clampMoveY(box.y + this.onKeyMoveY * signDy) + " " +
            box.width + " " +
            box.height)
    }

    scale(sign, px, py) {
        let box = this.svg.viewBox.baseVal
        if (this.currentScale <= this.minScale && sign < 0) {
            return
        }

        if (this.currentScale >= this.maxScale && sign > 0) {
            return
        }

        let cbox = this.workspace.getBoundingClientRect();
        if (typeof (px) == "undefined") {
            px = (-cbox.left + cbox.right) / 2;
        } else {
            px -= cbox.left;
        }

        if (typeof (py) == "undefined") {
            py = (-cbox.top + cbox.bottom) / 2;
        } else {
            py -= cbox.top;
        }


        let old_width = box.width
        let old_height = box.height
        let old_scale = this.currentScale
        let scaler = sign < 0 ? this.onKeyScale : 1 / this.onKeyScale
        this.currentScale = this.clampScale(this.currentScale * scaler)
        let new_width = old_width / old_scale * this.currentScale
        let new_height = old_height / old_scale * this.currentScale

        const pos_x =  px / (cbox.right - cbox.left)
        const pos_y = py / (cbox.bottom - cbox.top)
        let dx = (old_width - new_width) * pos_x
        let dy = (old_height - new_height) * pos_y

        this.svg.setAttribute(
            "viewBox",
            this.clampMoveX(box.x + dx) + " " +
            this.clampMoveY(box.y + dy) + " " +
            new_width + " " +
            new_height
        )
    }

    keydownListener(ev) {
        if (this.mouseDown) {
            return
        }
        switch (ev.key) {
            case "Down":
            case "ArrowDown":
                this.move(0, 1)
                break
            case "Up":
            case "ArrowUp":
                this.move(0, -1)
                break
            case "Left":
            case "ArrowLeft":
                this.move(-1, 0)
                break
            case "Right":
            case "ArrowRight":
                this.move(1, 0)
                break
            case "-":
                this.scale(1)
                break
            case "=":
            case "+":
                this.scale(-1)
                break
        }
    }

    wheelListener(ev) {
        if (this.mouseDown) {
            return
        }
        this.scale(Math.sign(ev.deltaY), ev.clientX, ev.clientY);
    }

    clientToSvg(x, y) {
        const box = this.svg.viewBox.baseVal
        const cbox = this.workspace.getBoundingClientRect()

        const px = x - cbox.left
        const py = y - cbox.top

        return {
            x: box.x + box.width * px / (cbox.right - cbox.left),
            y: box.y + box.height * py / (cbox.bottom - cbox.top)
        }
    }

    mousedownListener(ev) {
        if (!ev.shiftKey) {
            this.mouseDown = true;
            this.fixedPoint = this.clientToSvg(ev.clientX, ev.clientY)
        }
    }

    mouseupListener(ev) {
        this.mouseDown = false;
    }

    mousemoveListener(ev) {
        if (!this.mouseDown) {
            return

        }

        let box = this.svg.viewBox.baseVal

        const current = this.clientToSvg(ev.clientX, ev.clientY)

        let dx = current.x - this.fixedPoint.x
        let dy = current.y - this.fixedPoint.y

        this.svg.setAttribute(
            "viewBox",
            this.clampMoveX(box.x - dx) + " " +
            this.clampMoveY(box.y - dy) + " " +
            box.width + " " +
            box.height
        )
    }
}

for (const ws of document.querySelectorAll(".workspace")) {
    new ViewBoxController(ws)
}

