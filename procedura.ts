interface HTMLElement {
    node: PNode
    nodeOutput: POutput
    nodeInput: PInput
}
interface SVGPathElement {
    pathInput: HTMLElement
    pathOutput: HTMLElement
}

class PView {
    frameElement: HTMLElement
    linksElement: SVGSVGElement
    nodesTree: Array<PNode>

    draggedNode: HTMLElement|null
    dragStartX: number
    dragStartY: number

    cabledIO: HTMLElement|null
    cablingPath: SVGPathElement|null

    constructor(frameElement: HTMLElement) {
        this.frameElement = frameElement
        this.generateLinksElement()
        this.nodesTree = []

        this.draggedNode = null
        this.dragStartX = 0
        this.dragStartY = 0

        this.cabledIO = null
    }

    // add a node to the view
    addNode(node: PNode) {
        this.nodesTree.push(node)
        this.generateNodeElement(node)
    }
    // remove node of the tree
    removeNode(nodeElement: HTMLElement) {
        for (let input of nodeElement.node.inputs) {
            if (input.cable) {
                this.removeCable(input.cable)
            }
        }
        for (let output of nodeElement.node.outputs) {
            if (output.cable) {
                this.removeCable(output.cable)
            }
        }
        nodeElement.node.onRemove()
        nodeElement.remove()
    }
    // create and append the svg element that will store the paths elements
    private generateLinksElement() {
        this.linksElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        this.frameElement.appendChild(this.linksElement)
        this.linksElement.style.width = '100%'
        this.linksElement.style.height = '100%'
        this.linksElement.style.position = 'absolute'
        this.linksElement.style.zIndex = '1000000000'
        this.linksElement.style.pointerEvents = 'none'
    }
    // create and append the node element to view
    private generateNodeElement(node: PNode) {
        let nodeElement = document.createElement('div')
        nodeElement.classList.add('node')
        nodeElement.classList.add('node-'+node.name)

        let nodeElementBody = document.createElement('div')
        let nodeElementName = document.createElement('div')
        let nodeElementInputs = document.createElement('div')
        let nodeElementContent = document.createElement('div')
        let nodeElementOutputs = document.createElement('div')
        let nodeElementDelete = document.createElement('button')

        nodeElementBody.classList.add('node-body')
        nodeElementName.classList.add('node-name')
        nodeElementInputs.classList.add('node-inputs')
        nodeElementContent.classList.add('node-content')
        nodeElementOutputs.classList.add('node-outputs')
        nodeElementDelete.classList.add('node-delete')

        nodeElement.appendChild(nodeElementDelete)
        nodeElement.appendChild(nodeElementName)
        nodeElement.appendChild(nodeElementBody)
        nodeElementBody.appendChild(nodeElementInputs)
        nodeElementBody.appendChild(nodeElementOutputs)
        nodeElement.appendChild(nodeElementContent)

        nodeElementName.innerHTML = node.name

        for (let input of node.inputs) {                // append inputs
            let newInput = document.createElement('div')
            let newInputName = document.createElement('div')
            let newInputDot = document.createElement('div')

            newInput.classList.add('node-input')
            newInputName.classList.add('node-input-name')
            newInputDot.classList.add('node-input-dot')

            newInputName.style.pointerEvents = 'none'
            newInputDot.style.pointerEvents = 'none'
        
            newInput.appendChild(newInputDot)
            newInput.appendChild(newInputName)

            newInput.children[1].innerHTML = input.name
            nodeElementInputs.appendChild(newInput)
            newInput.nodeInput = input
            this.makeCablable(newInput)
        }

        for (let output of node.outputs) {              // append outputs
            let newOutput = document.createElement('div')
            let newOutputName = document.createElement('div')
            let newOutputDot = document.createElement('div')

            newOutput.classList.add('node-output')
            newOutputName.classList.add('node-output-name')
            newOutputDot.classList.add('node-output-dot')

            newOutputName.style.pointerEvents = 'none'
            newOutputDot.style.pointerEvents = 'none'
        
            newOutput.appendChild(newOutputName)
            newOutput.appendChild(newOutputDot)

            newOutput.children[0].innerHTML = output.name
            nodeElementOutputs.appendChild(newOutput)
            newOutput.nodeOutput = output
            this.makeCablable(newOutput)
        }

        nodeElementDelete.addEventListener('click', ()=>{this.removeNode(nodeElement)})
        this.frameElement.appendChild(nodeElement)      // append node to view
        nodeElement.node = node                         // add node to node element propreties
        node.contentElement = nodeElementContent
        node.onStart(node, nodeElementContent)          // call onStart function
        this.makeDraggable(nodeElement)                 // make it draggable
    }
    // make node element draggable
    private makeDraggable(nodeElement: HTMLElement) {
        let thisView = this

        // setup dragging listeners for nodes
        function startDragging(e: MouseEvent) {
            let draggedNodeRect = nodeElement.getBoundingClientRect()
            thisView.dragStartX = e.clientX - draggedNodeRect.x
            thisView.dragStartY = e.clientY - draggedNodeRect.y
            thisView.draggedNode = nodeElement
        }
        function stopDragging(e: MouseEvent) {
            thisView.draggedNode = null
        }
        function doDragging(e: MouseEvent) {
            if (thisView.draggedNode == null) {return null}
            if (e.buttons != 1) {return null}
            let mousePosX = e.clientX - thisView.dragStartX
            let mousePosY = e.clientY - thisView.dragStartY
            thisView.draggedNode.style.transform = 'translate('+mousePosX+'px, '+mousePosY+'px)'
            thisView.updateCables(thisView.draggedNode.node)
        }

        thisView.frameElement.addEventListener('mouseup', (e) => {stopDragging(e)})
        thisView.frameElement.addEventListener('mousemove', (e) => {doDragging(e)})
        nodeElement.addEventListener('mousedown', (e) => {startDragging(e)})
    }
    // make a node input or output element cablable
    private makeCablable(ioElement: HTMLElement) {
        let thisView = this

        // listeners handlers
        function startCabling(e: MouseEvent) {
            e.stopPropagation()
            if (!(e.currentTarget as HTMLElement).classList.contains('connected')) {
                thisView.cabledIO = e.currentTarget as HTMLElement
            }
        }
        function stopCabling(e: MouseEvent) {
            thisView.cabledIO = null
            thisView.cablingPath?.remove()
        }
        function mouseCabling(e: MouseEvent) {
            if (thisView.cabledIO != null) {
                thisView.cablingPath?.remove()
                if (thisView.cabledIO.classList.contains('node-input')) {
                    thisView.cablingPath = thisView.createCableToMouse(e, thisView.cabledIO.children[0] as HTMLElement)
                }
                else if (thisView.cabledIO.classList.contains('node-output')) {
                    thisView.cablingPath = thisView.createCableToMouse(e, thisView.cabledIO.children[1] as HTMLElement)
                }
            }
        }
        function doCabling(e: MouseEvent) {
            e.stopPropagation()
            if (!((thisView.cabledIO != null) && (e.currentTarget != null))) {
                thisView.cablingPath?.remove()
                thisView.cabledIO = null
                return 0
            }
            if ((e.currentTarget as HTMLElement).classList.contains('connected')) {
                thisView.cablingPath?.remove()
                thisView.cabledIO = null
                return 0
            }

            if (thisView.cabledIO.classList.contains('node-input') && (e.currentTarget as HTMLElement).classList.contains('node-output')) {
                let cable = thisView.createCable(thisView.cabledIO as HTMLElement, (e.currentTarget as HTMLElement) as HTMLElement);

                (e.currentTarget as HTMLElement).classList.add('connected');
                thisView.cabledIO.classList.add('connected');

                (e.currentTarget as HTMLElement).nodeOutput.cable = cable;
                (thisView.cabledIO as HTMLElement).nodeInput.cable = cable;
            }
            else if (thisView.cabledIO.classList.contains('node-output') && (e.currentTarget as HTMLElement).classList.contains('node-input')) {
                let cable = thisView.createCable((e.currentTarget as HTMLElement) as HTMLElement, thisView.cabledIO as HTMLElement);

                (e.currentTarget as HTMLElement).classList.add('connected');
                thisView.cabledIO.classList.add('connected');

                (thisView.cabledIO as HTMLElement).nodeOutput.cable = cable;
                (e.currentTarget as HTMLElement).nodeInput.cable = cable;

            }

            thisView.cablingPath?.remove()
            thisView.cabledIO = null
        }

        ioElement.addEventListener('mousedown', (e) => {startCabling(e)})
        ioElement.addEventListener('mouseup', (e) => {doCabling(e)})
        this.frameElement.addEventListener('mouseup', (e) => {stopCabling(e)})
        this.frameElement.addEventListener('mousemove', (e) => {mouseCabling(e)})
    }
    // Recreate cables (called on node element drag)
    private updateCables(node: PNode) {
        for (let input of node.inputs) {
            let pathInputElement = input.cable?.pathInput
            let pathOutputElement = input.cable?.pathOutput
            if (input.cable && pathInputElement && pathOutputElement) {
                input.cable.remove()
                let cable = this.createCable(pathInputElement, pathOutputElement)
                input.cable = cable
                pathOutputElement.nodeOutput.cable = cable
            }
        }
        for (let output of node.outputs) {
            let pathInputElement = output.cable?.pathInput
            let pathOutputElement = output.cable?.pathOutput
            if (output.cable && pathInputElement && pathOutputElement) {
                output.cable.remove()
                let cable = this.createCable(pathInputElement, pathOutputElement)
                output.cable = cable
                pathInputElement.nodeInput.cable = cable
            }
        }
    }
    // create a new cable
    private createCable(input: HTMLElement, output: HTMLElement) {
        let inputDot = input.children[0] as HTMLElement
        let outputDot = output.children[1] as HTMLElement

        let startPoint: DOMRect = outputDot.getBoundingClientRect()
        let endPoint: DOMRect = inputDot.getBoundingClientRect()

        let cable: SVGPathElement = this.linksElement.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'path'))
        cable.setAttribute('stroke', '#fff')
        cable.setAttribute('fill', 'none')
        cable.setAttribute('stroke-width', '5')
        cable.setAttribute('stroke-linecap', 'round')
        cable.setAttribute('d', 
            'M'+
            (startPoint.x + outputDot.offsetWidth / 2)+
            ','+
            (startPoint.y + outputDot.offsetWidth / 2)+
            ' Q'+
            ((startPoint.x + 10)+((endPoint.x - startPoint.x) / 2))+
            ','+
            ((startPoint.y < endPoint.y ? endPoint.y : startPoint.y) + 50)+
            ' '+
            (endPoint.x + inputDot.offsetHeight / 2)+
            ','+
            (endPoint.y + inputDot.offsetHeight / 2)
        )

        cable.style.pointerEvents = 'stroke'

        cable.pathInput = input
        cable.pathOutput = output

        input.nodeInput.cable = cable
        output.nodeOutput.cable = cable

        input.nodeInput.link = output.nodeOutput
        output.nodeOutput.link = input.nodeInput

        input.nodeInput.parentNode.update()
        output.nodeOutput.parentNode.update()

        cable.addEventListener('click', (e)=>{this.removeCable(cable)})

        return cable
    }
    // create a new cable going to mouse
    private createCableToMouse(e: MouseEvent, output: HTMLElement) {
        let startPoint: DOMRect = output.getBoundingClientRect()

        let cable: SVGPathElement = this.linksElement.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'path'))
        cable.setAttribute('stroke', '#fff')
        cable.setAttribute('fill', 'none')
        cable.setAttribute('stroke-width', '5')
        cable.setAttribute('stroke-linecap', 'round')
        cable.setAttribute('d', 
            'M'+
            (startPoint.x + output.offsetWidth / 2)+
            ','+
            (startPoint.y + output.offsetHeight / 2)+
            ' Q'+
            ((startPoint.x + 10)+((e.clientX - startPoint.x) / 2))+
            ','+
            ((startPoint.y < e.clientY ? e.clientY : startPoint.y) + 50)+
            ' '+
            (e.clientX)+
            ','+
            (e.clientY)
        )

        cable.style.pointerEvents = 'none'

        return cable
    }
    // remove cable in a clean way
    private removeCable(cable: SVGPathElement) {
        let inputElement = cable.pathInput
        let outputElement = cable.pathOutput

        cable.remove()

        inputElement.classList.remove('connected')
        outputElement.classList.remove('connected')

        inputElement.nodeInput.link = null
        outputElement.nodeOutput.link = null

        inputElement.nodeInput.cable = null
        outputElement.nodeOutput.cable = null

        inputElement.nodeInput.parentNode.update()
        outputElement.nodeOutput.parentNode.update()
    }
}

class PNode {
    name: string
    contentElement: HTMLElement
    inputs: Array<PInput>
    outputs: Array<POutput>
    onStart: Function
    onUpdate: Function
    onRemove: Function
    
    constructor(name: string) {
        this.name = name
        this.inputs = []
        this.outputs = []
        this.onStart = ()=>{}
        this.onUpdate = ()=>{}
        this.onRemove = ()=>{}
    }

    addInput(name: string) {
        let newInput = new PInput(this, name)
        this.inputs.push(newInput)
    }
    addOutput(name: string) {
        let newOutput = new POutput(this, name)
        this.outputs.push(newOutput)
    }
    update() {
        this.onUpdate(this, this.contentElement)
        for (let output of this.outputs) {      // call update on all child nodes
            output.link?.parentNode.update()
        }
    }
}

class PInput {
    parentNode: PNode
    name: string
    link: POutput|null
    cable: SVGPathElement|null

    constructor(parentNode: PNode, name: string) {
        this.parentNode = parentNode
        this.name = name
        this.link = null
        this.cable = null
    }
}

class POutput {
    parentNode: PNode
    name: string
    link: PInput|null
    cable: SVGPathElement|null
    value: any

    constructor(parentNode: PNode, name: string) {
        this.parentNode = parentNode
        this.name = name
        this.link = null
        this.cable = null
        this.value = null
    }
}

