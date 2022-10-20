import { GUICanvas } from "./canvas";

namespace MouseButton {
    export const LMB: MouseButton = 0
    export const MMB: MouseButton = 1
    export const RMB: MouseButton = 2
}

interface MouseButton extends Number { }

interface PortConnection {
    outputPort: EffectPort
    inputPort: EffectPort
}

interface DragData {
    node: EffectNode
    relativePosition: Vec2
}

export class NodeControls extends GUICanvas {
    private readonly nodes: EffectNode[] = []
    private readonly connections: PortConnection[] = []
    selectedPort: EffectPort | undefined
    mousePosition: Vec2 = vec2(0, 0)
    nodeDragData: DragData | undefined

    constructor(readonly nodeTypeSelector: NodeTypeSelector, readonly audioContext: AudioContext, canvasElement: HTMLCanvasElement) {
        super(canvasElement)
        this.addListeners()
    }

    draw(time: number) {
        const ctx = this.drawContext

        for (const node of this.nodes) {
            const { x, y } = node.position
            ctx.translate(x, y)
            node.draw(ctx, time)

            for (const port of node.ports) {
                const { x: portX, y: portY } = port.position
                ctx.translate(portX, portY)
                port.draw(ctx, time)
                ctx.translate(-portX, -portY)
            }

            ctx.translate(-x, -y)
        }

        for (const connection of this.connections) {
            ctx.strokeStyle = 'green'
            ctx.lineWidth = 2
            ctx.beginPath()
            const { x: x1, y: y1 } = connection.inputPort.getCanvasPosition()
            ctx.moveTo(x1, y1)
            const { x: x2, y: y2 } = connection.outputPort.getCanvasPosition()
            ctx.lineTo(x2, y2)
            ctx.stroke()
        }

        const selectedPort = this.selectedPort
        if (selectedPort !== undefined) {
            ctx.strokeStyle = 'green'
            ctx.lineWidth = 2
            const { x, y } = selectedPort.position.add(selectedPort.node.position)
            console.log(`start line at ${x}, ${y}`)
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(this.mousePosition.x, this.mousePosition.y)
            ctx.stroke()
        }
    }

    private addListeners() {
        const elem = this.canvasElement
        elem.addEventListener('mouseup', e => {
            this.handleMouseEvent(e, false)
        })

        elem.addEventListener('mousedown', e => {
            this.handleMouseEvent(e, true)
        })

        elem.addEventListener('mousemove', e => {
            const { offsetX, offsetY } = e
            this.mousePosition = vec2(offsetX, offsetY)
        })
    }

    private handleMouseEvent(e: MouseEvent, mouseDown: boolean) {
        let { clientX: clickXRelativeToViewport, clientY: clickYRelativeToViewport } = e
            
        const rect = this.canvasElement.getBoundingClientRect()
        let { left: canvasLeftRelativeToViewport, top: canvasTopRelativeToViewport } = rect

        const x = clickXRelativeToViewport - canvasLeftRelativeToViewport
        const y = clickYRelativeToViewport - canvasTopRelativeToViewport

        const position = vec2(x, y)
        const { button } = e


        if (!mouseDown) {
            console.log('mouse up')
            const nodeDragData = this.nodeDragData
            if (nodeDragData !== undefined) {
                console.log('we were dragging, so update node position')
                nodeDragData.node.position = this.mousePosition
                console.log(`Mouse position: ${this.mousePosition}`)
                console.log(`New node position: ${nodeDragData.node.position}`)
                this.nodeDragData = undefined
            }
        }

        let handled = false
        for (const node of this.nodes) {
            handled = node.handleClick(position, button, mouseDown)
            if (handled) {
                break
            }
        }

        if (!handled) {
            this.handleCanvasClick(vec2(x, y), button)
        }
    }

    private handleCanvasClick(position: Vec2, button: MouseButton) {
        if (this.selectedPort !== undefined) {
            this.selectedPort = undefined
            return
        }

        if (button === MouseButton.RMB) {
            this.createNodeFromSelection(position)
        }
    }

    private createNodeFromSelection(position: Vec2) {
        const selection = this.nodeTypeSelector.getSelection()
        switch (selection) {
            case NodeTypeSelection.GAIN: {
                const node = new SimpleGainEffectNode(this.audioContext, position, this)
                this.nodes.push(node)
                break
            }
        }
    }

    private connectionHasPort(connection: PortConnection, port: EffectPort) {
        return connection.inputPort === port || connection.outputPort === port
    }

    getConnections(port: EffectPort) {
        return this.connections.filter(connection => this.connectionHasPort(connection, port))
    }

    addConnection(port1: EffectPort, port2: EffectPort) {
        if (port1.direction === port2.direction) {
            throw 'arguments must have different directions'
        }

        let inputPort: EffectPort
        let outputPort: EffectPort
        if (port1.direction === PortDirection.IN) {
            inputPort = port1
            outputPort = port2
        } else {
            inputPort = port2
            outputPort = port1
        }

        // Remove connection if already connected
        for (let i = 0; i < this.connections.length; i++) {
            const connection = this.connections[i]
            if (this.connectionHasPort(connection, inputPort)) {
                this.connections.splice(i)
            }
        }

        this.connections.push({ inputPort, outputPort })
    }
}

class Vec2 {
    constructor(readonly x: number, readonly y: number) { }

    add(rhs: Vec2) {
        return vec2(this.x + rhs.x, this.y + rhs.y)
    }

    sub(rhs: Vec2) {
        return vec2(this.x - rhs.x, this.y - rhs.y)
    }

    toString() {
        return `(${this.x}, ${this.y})`
    }
}

function vec2(x: number, y: number) {
    return new Vec2(x, y)
}

class Rect {
    constructor(readonly topLeft: Vec2, readonly bottomRight: Vec2) { }

    isInside(position: Vec2) {
        return position.x >= this.topLeft.x && position.y >= this.topLeft.y && position.x <= this.bottomRight.x && position.y <= this.bottomRight.y
    }
}

function rect(topLeft: Vec2, bottomRight: Vec2) {
    return new Rect(topLeft, bottomRight)
}

interface EffectNode extends InputEventHandler, Drawable, NodeControlComponent {
    readonly ports: EffectPort[]
    position: Vec2
}

namespace PortDirection {
    export const IN:  PortDirection = 0
    export const OUT: PortDirection = 1
}

interface PortDirection extends Number { }

interface InputEventHandler {
    /**
     * 
     * @param position
     * @param button 
     * @returns true if the click was handled, else false
     */
    handleClick(position: Vec2, button: number, mouseDown: boolean): boolean
}

interface Drawable {
    draw(ctx: CanvasRenderingContext2D, time: number): void
}

interface NodeControlComponent {
    nodeControls: NodeControls
}

interface EffectPort extends InputEventHandler, Drawable, NodeControlComponent {
    readonly name: string
    readonly direction: PortDirection
    position: Vec2
    readonly node: EffectNode
    getCanvasPosition(): Vec2
}

abstract class AbstractEffectPort implements EffectPort {
    constructor(readonly name: string, readonly direction: PortDirection, public position: Vec2, private bounds: Rect, readonly nodeControls: NodeControls, readonly node: EffectNode) { }

    draw(ctx: CanvasRenderingContext2D, time: number) { }

    handleClick(position: Vec2, button: number, mouseDown: boolean) {
        console.log(`click port at rel ${position}, (port at ${this.position})`)
        if (this.bounds.isInside(position)) {
            this.handleClickInside(position, button, mouseDown)
            return true
        } else {
            return false
        }
    }

    protected abstract handleClickInside(position: Vec2, button: number, mouseDown: boolean): void

    getCanvasPosition(): Vec2 {
        return this.position.add(this.node.position)
    }
}

class SimpleEffectPort extends AbstractEffectPort {
    constructor(name: string, direction: PortDirection, position: Vec2, nodeControls: NodeControls, node: EffectNode) {
        super(name, direction, position, rect(vec2(position.x - 5, position.y - 5), vec2(position.x + 5, position.y + 5)), nodeControls, node)
    }

    draw(ctx: CanvasRenderingContext2D, time: number) {
        const { x, y } = this.position
        ctx.fillStyle = 'red'
        // ctx.ellipse(x, y, 10, 10, 0, 0, 2 * Math.PI)
        ctx.fillRect(-5, -5, 10, 10)
    }

    handleClickInside(position: Vec2, button: number, mouseDown: boolean) {
        console.log('click inside port')
        if (button === MouseButton.LMB && mouseDown) {
            const selectedPort = this.nodeControls.selectedPort
            if (selectedPort === undefined) {
                this.nodeControls.selectedPort = this
                console.log('port selected')
                return
            }

            this.nodeControls.selectedPort = undefined
            console.log('connection deselected')

            if (this.direction !== selectedPort.direction) {
                this.nodeControls.addConnection(this, selectedPort)
                console.log('added connection')
                return
            }
        }
    }
}

abstract class AbstractEffectNode implements EffectNode {
    constructor(public position: Vec2, public ports: EffectPort[], private bounds: Rect, readonly nodeControls: NodeControls) { }

    draw(ctx: CanvasRenderingContext2D, time: number): void {
        ctx.fillStyle = 'white'
        ctx.fillRect(-50, -50, 100, 100)
    }

    handleClick(position: Vec2, button: number, mouseDown: boolean) {
        console.log('click')
        if (this.bounds.isInside(position)) {
            for (const port of this.ports) {
                const nodeRelativePosition = position.sub(this.position)
                const handled = port.handleClick(nodeRelativePosition, button, mouseDown)
                if (handled) {
                    return true
                }
            }

            if (mouseDown) {
                console.log('Start dragging node')
                const relativePosition = this.position.sub(this.nodeControls.mousePosition)
                this.nodeControls.nodeDragData = { node: this, relativePosition }
            }

            this.handleClickInside(position, button, mouseDown)
            return true
        } else {
            return false
        }
    }

    protected abstract handleClickInside(position: Vec2, button: number, mouseDown: boolean): void

    addPort(name: string, direction: PortDirection, position: Vec2) {
        this.ports.push(new SimpleEffectPort(name, direction, position, this.nodeControls, this))
    }
}

class AudioAPIEffectNode extends AbstractEffectNode {
    constructor(readonly context: AudioContext, readonly audioNode: AudioNode, public position: Vec2, nodeControls: NodeControls) {
        // TODO: Bounds should be absolute, not relative to the node's position on the canvas.
        super(position, [], rect(vec2(position.x - 50, position.y - 50), vec2(position.x + 50, position.y + 50)), nodeControls)
    }

    handleClickInside(position: Vec2, button: number) {
        console.log('click inside node')
    }
}

class SimpleGainEffectNode extends AudioAPIEffectNode {
    constructor(context: AudioContext, position: Vec2, nodeControls: NodeControls) {
        super(context, context.createGain(), position, nodeControls)

        this.addPort('input', PortDirection.IN, vec2(-45, 25))
        this.addPort('gain', PortDirection.IN, vec2(-45, -25))
        this.addPort('output', PortDirection.OUT, vec2(45, 0))
    }
}

class AudioPlayerOverrideNode extends AbstractEffectNode {
    protected handleClickInside(position: Vec2, button: number): void {
        // if ()
    }
}

namespace NodeTypeSelection {
    export const GAIN: NodeTypeSelection = 0
}

interface NodeTypeSelection extends Number { }

export class NodeTypeSelector {
    private selection: NodeTypeSelection = NodeTypeSelection.GAIN
    private elements: HTMLElement[] = []

    constructor(readonly element: HTMLDivElement) {
        this.addNodeElements()
        this.select(this.selection)
    }

    private addNodeElements() {
        const gainNodeElement = document.createElement('button')
        this.addNodeElement('Gain', gainNodeElement, NodeTypeSelection.GAIN)
    }

    private addNodeElement(title: string, element: HTMLElement, selection: NodeTypeSelection) {
        element.textContent = title
        element.style.border = 'none'

        element.onclick = _ => {
            this.select(selection)
        }

        this.elements.push(element)

        this.element.appendChild(element)
    }

    private select(selection: NodeTypeSelection) {
        this.selection = selection

        for (const e of this.elements) {
            e.style.border = 'none'
        }

        this.elements[<number> selection].style.border = '1px solid white'
    }

    getSelection() {
        return this.selection
    }
}
