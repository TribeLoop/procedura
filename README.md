# procedura
A JavaScript implementation of a visual node-based environment, allowing users to create, connect, and manipulate nodes.

![Procedura Demo](https://github.com/TribeLoop/procedura/assets/99650975/daec802f-a8fc-4653-ae2d-be8b7dc2529c)

**It's higly reccommended to start with the demo css and modify it as needed**

How to use :

```javascript
// define #main as the main view 
let PROCEDURA_VIEW = new PView(document.getElementById('main'))

// create a new node template function
function createNode() {
    // create the node obj and define name
    let newNode = new PNode('my node')

    // add inputs this way
    newNode.addInput('some input')
    newNode.addInput('another input')

    // add outputs this way
    newNode.addOutput('some output')        

    // this function is called when node is append to view
    newNode.onStart = (nodeObj, nodeContentElment) => {     
        // setup some stuff here
    }

    // this function is called on every change on links, or higher nodes updates, and will trigger the onUpdate of all lower nodes
    newNode.onUpdate = (nodeObj, nodeContentElment) => { 
        // access node inputs this way
        let inputValueA = nodeObj.inputs[0].link.value
        let inputValueB = nodeObj.inputs[1].link.value
        
        // do your main stuff here

        // set outputs values this way
        nodeObj.outputs[0].value = outputValue
    }

    // this function is called on node remove, before the links gets deleted
    newNode.onRemove = (nodeObj, nodeContentElment) => {
        // clear some stuff here
    }

    return newNode
}

// append node to main view
PROCEDURA_VIEW.addNode(createNode())
```

To-do :
- type system for inputs and outputs
- multi-selection for group actions on nodes
- customizable context menu system
- one-to-many links possibility
