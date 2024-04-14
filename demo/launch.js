// define #main as the main view 
let PROCEDURA_VIEW = new PView(document.getElementById('main'))

// return node "number"
function getNodeNumber() {
    let newNode = new PNode('number')
    newNode.addOutput('number')
    newNode.onStart = (newNode, nodeContentElment) => {
        let textInput = nodeContentElment.appendChild(document.createElement('input'))
        textInput.type = 'number'
        textInput.addEventListener('change', (e)=>{
            newNode.outputs[0].value = Number(e.srcElement.value)
            newNode.update()
        })
        newNode.outputs[0].value = 0
    }
    return newNode
}

// return node "add"
function getNodeAdd() {
    let newNode = new PNode('add')
    newNode.addInput('number A')
    newNode.addInput('number B')
    newNode.addOutput('result')
    newNode.onUpdate = (newNode, nodeContentElment) => {
        if (newNode.inputs[0].link && newNode.inputs[1].link) {
            let result = newNode.inputs[0].link.value + newNode.inputs[1].link.value
            newNode.outputs[0].value = result
        }
        else if (newNode.inputs[0].link) {
            newNode.outputs[0].value = newNode.inputs[0].link.value
        }
        else if (newNode.inputs[1].link) {
            newNode.outputs[0].value = newNode.inputs[1].link.value
        }
        else {
            newNode.outputs[0].value = '0'
        }
    }

    return newNode
}

// return node "print"
function getNodePrint() {
    let newNode = new PNode('print')
    newNode.addInput('number')
    newNode.onUpdate = (newNode, nodeContentElment) => {
        if (newNode.inputs[0].link) {
            let result = newNode.inputs[0].link.value
            nodeContentElment.innerHTML = result
        }
        else {
            nodeContentElment.innerHTML = '0'
        }
    }

    return newNode
}

// append to view
PROCEDURA_VIEW.addNode(getNodeNumber())
PROCEDURA_VIEW.addNode(getNodeNumber())
PROCEDURA_VIEW.addNode(getNodeAdd())
PROCEDURA_VIEW.addNode(getNodePrint())

