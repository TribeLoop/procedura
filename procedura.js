var PView = /** @class */ (function () {
    function PView(frameElement) {
        this.frameElement = frameElement;
        this.generateLinksElement();
        this.nodesTree = [];
        this.draggedNode = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.cabledIO = null;
    }
    // add a node to the view
    PView.prototype.addNode = function (node) {
        this.nodesTree.push(node);
        this.generateNodeElement(node);
    };
    // remove node of the tree
    PView.prototype.removeNode = function (nodeElement) {
        nodeElement.node.onRemove();
        for (var _i = 0, _a = nodeElement.node.inputs; _i < _a.length; _i++) {
            var input = _a[_i];
            if (input.cable) {
                this.removeCable(input.cable);
            }
        }
        for (var _b = 0, _c = nodeElement.node.outputs; _b < _c.length; _b++) {
            var output = _c[_b];
            if (output.cable) {
                this.removeCable(output.cable);
            }
        }
        nodeElement.remove();
    };
    // create and append the svg element that will store the paths elements
    PView.prototype.generateLinksElement = function () {
        this.linksElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.frameElement.appendChild(this.linksElement);
        this.linksElement.style.width = '100%';
        this.linksElement.style.height = '100%';
        this.linksElement.style.position = 'absolute';
        this.linksElement.style.zIndex = '1000000000';
        this.linksElement.style.pointerEvents = 'none';
    };
    // create and append the node element to view
    PView.prototype.generateNodeElement = function (node) {
        var _this = this;
        var nodeElement = document.createElement('div');
        nodeElement.classList.add('node');
        nodeElement.classList.add('node-' + node.name);
        var nodeElementBody = document.createElement('div');
        var nodeElementName = document.createElement('div');
        var nodeElementInputs = document.createElement('div');
        var nodeElementContent = document.createElement('div');
        var nodeElementOutputs = document.createElement('div');
        var nodeElementDelete = document.createElement('button');
        nodeElementBody.classList.add('node-body');
        nodeElementName.classList.add('node-name');
        nodeElementInputs.classList.add('node-inputs');
        nodeElementContent.classList.add('node-content');
        nodeElementOutputs.classList.add('node-outputs');
        nodeElementDelete.classList.add('node-delete');
        nodeElement.appendChild(nodeElementDelete);
        nodeElement.appendChild(nodeElementName);
        nodeElement.appendChild(nodeElementBody);
        nodeElementBody.appendChild(nodeElementInputs);
        nodeElementBody.appendChild(nodeElementOutputs);
        nodeElement.appendChild(nodeElementContent);
        nodeElementName.innerHTML = node.name;
        for (var _i = 0, _a = node.inputs; _i < _a.length; _i++) { // append inputs
            var input = _a[_i];
            var newInput = document.createElement('div');
            var newInputName = document.createElement('div');
            var newInputDot = document.createElement('div');
            newInput.classList.add('node-input');
            newInputName.classList.add('node-input-name');
            newInputDot.classList.add('node-input-dot');
            newInputName.style.pointerEvents = 'none';
            newInputDot.style.pointerEvents = 'none';
            newInput.appendChild(newInputDot);
            newInput.appendChild(newInputName);
            newInput.children[1].innerHTML = input.name;
            nodeElementInputs.appendChild(newInput);
            newInput.nodeInput = input;
            this.makeCablable(newInput);
        }
        for (var _b = 0, _c = node.outputs; _b < _c.length; _b++) { // append outputs
            var output = _c[_b];
            var newOutput = document.createElement('div');
            var newOutputName = document.createElement('div');
            var newOutputDot = document.createElement('div');
            newOutput.classList.add('node-output');
            newOutputName.classList.add('node-output-name');
            newOutputDot.classList.add('node-output-dot');
            newOutputName.style.pointerEvents = 'none';
            newOutputDot.style.pointerEvents = 'none';
            newOutput.appendChild(newOutputName);
            newOutput.appendChild(newOutputDot);
            newOutput.children[0].innerHTML = output.name;
            nodeElementOutputs.appendChild(newOutput);
            newOutput.nodeOutput = output;
            this.makeCablable(newOutput);
        }
        nodeElementDelete.addEventListener('click', function () { _this.removeNode(nodeElement); });
        this.frameElement.appendChild(nodeElement); // append node to view
        nodeElement.node = node; // add node to node element propreties
        node.contentElement = nodeElementContent;
        node.onStart(node, nodeElementContent); // call onStart function
        this.makeDraggable(nodeElement); // make it draggable
    };
    // make node element draggable
    PView.prototype.makeDraggable = function (nodeElement) {
        var thisView = this;
        // setup dragging listeners for nodes
        function startDragging(e) {
            var draggedNodeRect = nodeElement.getBoundingClientRect();
            thisView.dragStartX = e.clientX - draggedNodeRect.x;
            thisView.dragStartY = e.clientY - draggedNodeRect.y;
            thisView.draggedNode = nodeElement;
        }
        function stopDragging(e) {
            thisView.draggedNode = null;
        }
        function doDragging(e) {
            if (thisView.draggedNode == null) {
                return null;
            }
            if (e.buttons != 1) {
                return null;
            }
            var mousePosX = e.clientX - thisView.dragStartX;
            var mousePosY = e.clientY - thisView.dragStartY;
            thisView.draggedNode.style.transform = 'translate(' + mousePosX + 'px, ' + mousePosY + 'px)';
            thisView.updateCables(thisView.draggedNode.node);
        }
        thisView.frameElement.addEventListener('mouseup', function (e) { stopDragging(e); });
        thisView.frameElement.addEventListener('mousemove', function (e) { doDragging(e); });
        nodeElement.addEventListener('mousedown', function (e) { startDragging(e); });
    };
    // make a node input or output element cablable
    PView.prototype.makeCablable = function (ioElement) {
        var thisView = this;
        // listeners handlers
        function startCabling(e) {
            e.stopPropagation();
            if (!e.currentTarget.classList.contains('connected')) {
                thisView.cabledIO = e.currentTarget;
            }
        }
        function stopCabling(e) {
            var _a;
            thisView.cabledIO = null;
            (_a = thisView.cablingPath) === null || _a === void 0 ? void 0 : _a.remove();
        }
        function mouseCabling(e) {
            var _a;
            if (thisView.cabledIO != null) {
                (_a = thisView.cablingPath) === null || _a === void 0 ? void 0 : _a.remove();
                if (thisView.cabledIO.classList.contains('node-input')) {
                    thisView.cablingPath = thisView.createCableToMouse(e, thisView.cabledIO.children[0]);
                }
                else if (thisView.cabledIO.classList.contains('node-output')) {
                    thisView.cablingPath = thisView.createCableToMouse(e, thisView.cabledIO.children[1]);
                }
            }
        }
        function doCabling(e) {
            var _a, _b, _c;
            e.stopPropagation();
            if (!((thisView.cabledIO != null) && (e.currentTarget != null))) {
                (_a = thisView.cablingPath) === null || _a === void 0 ? void 0 : _a.remove();
                thisView.cabledIO = null;
                return 0;
            }
            if (e.currentTarget.classList.contains('connected')) {
                (_b = thisView.cablingPath) === null || _b === void 0 ? void 0 : _b.remove();
                thisView.cabledIO = null;
                return 0;
            }
            if (thisView.cabledIO.classList.contains('node-input') && e.currentTarget.classList.contains('node-output')) {
                var cable = thisView.createCable(thisView.cabledIO, e.currentTarget);
                e.currentTarget.classList.add('connected');
                thisView.cabledIO.classList.add('connected');
                e.currentTarget.nodeOutput.cable = cable;
                thisView.cabledIO.nodeInput.cable = cable;
            }
            else if (thisView.cabledIO.classList.contains('node-output') && e.currentTarget.classList.contains('node-input')) {
                var cable = thisView.createCable(e.currentTarget, thisView.cabledIO);
                e.currentTarget.classList.add('connected');
                thisView.cabledIO.classList.add('connected');
                thisView.cabledIO.nodeOutput.cable = cable;
                e.currentTarget.nodeInput.cable = cable;
            }
            (_c = thisView.cablingPath) === null || _c === void 0 ? void 0 : _c.remove();
            thisView.cabledIO = null;
        }
        ioElement.addEventListener('mousedown', function (e) { startCabling(e); });
        ioElement.addEventListener('mouseup', function (e) { doCabling(e); });
        this.frameElement.addEventListener('mouseup', function (e) { stopCabling(e); });
        this.frameElement.addEventListener('mousemove', function (e) { mouseCabling(e); });
    };
    // Recreate cables (called on node element drag)
    PView.prototype.updateCables = function (node) {
        var _a, _b, _c, _d;
        for (var _i = 0, _e = node.inputs; _i < _e.length; _i++) {
            var input = _e[_i];
            var pathInputElement = (_a = input.cable) === null || _a === void 0 ? void 0 : _a.pathInput;
            var pathOutputElement = (_b = input.cable) === null || _b === void 0 ? void 0 : _b.pathOutput;
            if (input.cable && pathInputElement && pathOutputElement) {
                input.cable.remove();
                var cable = this.createCable(pathInputElement, pathOutputElement);
                input.cable = cable;
                pathOutputElement.nodeOutput.cable = cable;
            }
        }
        for (var _f = 0, _g = node.outputs; _f < _g.length; _f++) {
            var output = _g[_f];
            var pathInputElement = (_c = output.cable) === null || _c === void 0 ? void 0 : _c.pathInput;
            var pathOutputElement = (_d = output.cable) === null || _d === void 0 ? void 0 : _d.pathOutput;
            if (output.cable && pathInputElement && pathOutputElement) {
                output.cable.remove();
                var cable = this.createCable(pathInputElement, pathOutputElement);
                output.cable = cable;
                pathInputElement.nodeInput.cable = cable;
            }
        }
    };
    // create a new cable
    PView.prototype.createCable = function (input, output) {
        var _this = this;
        var inputDot = input.children[0];
        var outputDot = output.children[1];
        var startPoint = outputDot.getBoundingClientRect();
        var endPoint = inputDot.getBoundingClientRect();
        var cable = this.linksElement.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'path'));
        cable.setAttribute('stroke', '#fff');
        cable.setAttribute('fill', 'none');
        cable.setAttribute('stroke-width', '5');
        cable.setAttribute('stroke-linecap', 'round');
        cable.setAttribute('d', 'M' +
            (startPoint.x + outputDot.offsetWidth / 2) +
            ',' +
            (startPoint.y + outputDot.offsetWidth / 2) +
            ' Q' +
            ((startPoint.x + 10) + ((endPoint.x - startPoint.x) / 2)) +
            ',' +
            ((startPoint.y < endPoint.y ? endPoint.y : startPoint.y) + 50) +
            ' ' +
            (endPoint.x + inputDot.offsetHeight / 2) +
            ',' +
            (endPoint.y + inputDot.offsetHeight / 2));
        cable.style.pointerEvents = 'stroke';
        cable.pathInput = input;
        cable.pathOutput = output;
        input.nodeInput.cable = cable;
        output.nodeOutput.cable = cable;
        input.nodeInput.link = output.nodeOutput;
        output.nodeOutput.link = input.nodeInput;
        input.nodeInput.parentNode.update();
        output.nodeOutput.parentNode.update();
        cable.addEventListener('click', function (e) { _this.removeCable(cable); });
        return cable;
    };
    // create a new cable going to mouse
    PView.prototype.createCableToMouse = function (e, output) {
        var startPoint = output.getBoundingClientRect();
        var cable = this.linksElement.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'path'));
        cable.setAttribute('stroke', '#fff');
        cable.setAttribute('fill', 'none');
        cable.setAttribute('stroke-width', '5');
        cable.setAttribute('stroke-linecap', 'round');
        cable.setAttribute('d', 'M' +
            (startPoint.x + output.offsetWidth / 2) +
            ',' +
            (startPoint.y + output.offsetHeight / 2) +
            ' Q' +
            ((startPoint.x + 10) + ((e.clientX - startPoint.x) / 2)) +
            ',' +
            ((startPoint.y < e.clientY ? e.clientY : startPoint.y) + 50) +
            ' ' +
            (e.clientX) +
            ',' +
            (e.clientY));
        cable.style.pointerEvents = 'none';
        return cable;
    };
    // remove cable in a clean way
    PView.prototype.removeCable = function (cable) {
        var inputElement = cable.pathInput;
        var outputElement = cable.pathOutput;
        cable.remove();
        inputElement.classList.remove('connected');
        outputElement.classList.remove('connected');
        inputElement.nodeInput.link = null;
        outputElement.nodeOutput.link = null;
        inputElement.nodeInput.cable = null;
        outputElement.nodeOutput.cable = null;
        inputElement.nodeInput.parentNode.update();
        outputElement.nodeOutput.parentNode.update();
    };
    return PView;
}());
var PNode = /** @class */ (function () {
    function PNode(name) {
        this.name = name;
        this.inputs = [];
        this.outputs = [];
        this.onStart = function () { };
        this.onUpdate = function () { };
        this.onRemove = function () { };
    }
    PNode.prototype.addInput = function (name) {
        var newInput = new PInput(this, name);
        this.inputs.push(newInput);
    };
    PNode.prototype.addOutput = function (name) {
        var newOutput = new POutput(this, name);
        this.outputs.push(newOutput);
    };
    PNode.prototype.update = function () {
        var _a;
        this.onUpdate(this, this.contentElement);
        for (var _i = 0, _b = this.outputs; _i < _b.length; _i++) { // call update on all child nodes
            var output = _b[_i];
            (_a = output.link) === null || _a === void 0 ? void 0 : _a.parentNode.update();
        }
    };
    return PNode;
}());
var PInput = /** @class */ (function () {
    function PInput(parentNode, name) {
        this.parentNode = parentNode;
        this.name = name;
        this.link = null;
        this.cable = null;
    }
    return PInput;
}());
var POutput = /** @class */ (function () {
    function POutput(parentNode, name) {
        this.parentNode = parentNode;
        this.name = name;
        this.link = null;
        this.cable = null;
        this.value = null;
    }
    return POutput;
}());
