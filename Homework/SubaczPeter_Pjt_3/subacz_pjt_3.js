var points;
var colors;

var NumVertices  = 36;

var gl;

var fovy = 60.0;  // Field-of-view in Y direction angle (in degrees)
var aspect;       // Viewport aspect ratio
var program;

var mvMatrix, pMatrix;
var modelView, projection;
var eye;


var stack = [];
var HierarchyModel = [];

// spheres 
var levelZeroObject = cube();
var levelOneObject0 = cube();
var levelOneObject1 = cube();
var levelTwoObject0 = cube();
var levelTwoObject1 = cube();
var levelThreeObject0 = cube();
var levelThreeObject1 = cube();
//testing cubes
var redCube = cube();
var blueCube = cube();
var greenCube = cube();
var magentaCube = cube();
var theCube = cube();

//time
currentTime = 0;

//tree size
var numberOfBranches = 3;		//number of subtrees within 
var treeDisplacementX = 2.5;
var treeDisplacementY = 2.5;
var treeDisplacementZ = 0;
var treeLineDecay = 1.5;

var beta = 0;

function modelRotations(){
	beta +=1
	if (360%beta==1){
		beta = 0;
	}
}

function main(){
	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
    gl = WebGLUtils.setupWebGL(canvas);

	//Check that the return value is not null.
	if (!gl)
	{
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// Initialize shaders
	program = initShaders(gl, "vshader", "fshader");
	gl.useProgram(program);

	//Set up the viewport
    gl.viewport( 0, 0, 400, 400);

	aspect =  canvas.width/canvas.height;
	
    // Set clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas> by clearing the color buffer
    gl.enable(gl.DEPTH_TEST);

	points = [];
	colors = [];

    projection = gl.getUniformLocation(program, "projectionMatrix");
	modelView = gl.getUniformLocation(program, "modelMatrix");
	var offsetLoc = gl.getUniformLocation(program, "vPointSize");
	gl.uniform1f(offsetLoc, 7.5);

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    render();
}

function sphere(){
}

function cube(){
    var verts = [];
    verts = verts.concat(quad( 1, 0, 3, 2 ));
    verts = verts.concat(quad( 2, 3, 7, 6 ));
    verts = verts.concat(quad( 3, 0, 4, 7 ));
    verts = verts.concat(quad( 6, 5, 1, 2 ));
    verts = verts.concat(quad( 4, 5, 6, 7 ));
    verts = verts.concat(quad( 5, 4, 0, 1 ));
    return verts;
}

function computeHierarchyModel(){
	/*
		Computes a model hierarchy for 3 distinct levels 
					o				level 0 obects	
					|				
				o-------o			level 1 objects
				|		|
			  o---o	  o---o			level 2 objects


		0. Reset: All objects start out as centered, the 0th object is translated 
			to the top 
		1. Draw lines: Vertical and horzontal lines are drawn from the parent level 
			to the child level.
		2. Child objects are then translated to the ends of the horzontal lines in
			step 1
		3. Repeat steps 1 & 2 for each level.
	*/
	
	modelRotations();			//increment rotation angle
	mvMatrix = mult(mvMatrix,rotateY(-beta));//rotations 
	gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix));
	draw_object(theCube, vec4(1.0, 0.0, 0.0, 1.0));

	treeDisplacementX = 10;
	attach_subtrees(numberOfBranches);
}

function attach_subtrees(numberTrees){
	/* 
		Recusively attach lower leveled objects.
	*/
	
	// numberTrees-=1;
	// 
	stack.push(mvMatrix); 
	treeDisplacementX /=2;
	if(numberTrees>0){
		draw_lines();
		if (stack.length%2>0){
			//draw the right object 
			mvMatrix = mult(mvMatrix, translate(treeDisplacementX, -treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix, rotateY(2*beta));
			gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix));
			draw_object(theCube, vec4(0.0, 0.0, 1.0, 1.0));
			attach_subtrees(numberTrees-1);	//did somebody say recursion?
			//draw the left object 
			mvMatrix = mult(mvMatrix, rotateY(-2*beta));
			mvMatrix = mult(mvMatrix,translate(-treeDisplacementX, treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix,translate(-treeDisplacementX, -treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix, rotateY(2*beta));
			gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
			draw_object(theCube, vec4(0.0, 0.0, 1.0, 1.0));
			attach_subtrees(numberTrees-1);		//did somebody say recursion?

		}else{
			//draw the right object
			mvMatrix = mult(mvMatrix, translate(treeDisplacementX, -treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix, rotateY(-2*beta));
			gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix));
			draw_object(theCube, vec4(0.0, 1.0, 0.0, 1.0));
			attach_subtrees(numberTrees-1);		//did somebody say recursion?
			// draw the left object 
			mvMatrix = mult(mvMatrix, rotateY(2*beta));
			mvMatrix = mult(mvMatrix,translate(-treeDisplacementX, treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix,translate(-treeDisplacementX, -treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix, rotateY(-2*beta));
			gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix));
			draw_object(theCube, vec4(0.0, 1.0, 0.0, 1.0));
			attach_subtrees(numberTrees-1);		//did somebody say recursion?
		}
	}
	treeDisplacementX*=2;
	mvMatrix = stack.pop();
}

function render()
{
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

    pMatrix = perspective(fovy, aspect, 0.001, 50);
	gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );
	
	eye = vec3(0, -5, -20);
	at = vec3(0.0, -5, 0.0);
	up = vec3(0.0, 1.0, 0.0);
	mvMatrix = lookAt(eye, at , up);
	
	computeHierarchyModel();

	if (animation){ //recursive animation 
		id = requestAnimationFrame(render);
	}
}

var animation = true;
var id;

function draw_object(cube, color){
    var fragColors = [];

    for(var i = 0; i < cube.length; i++)
    {
        fragColors.push(color);
    }

    var pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cube), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program,  "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(fragColors), gl.STATIC_DRAW);

    var vColor= gl.getAttribLocation(program,  "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
	gl.drawArrays( gl.TRIANGLES, 0, NumVertices);

	gl.deleteBuffer(pBuffer);
	gl.deleteBuffer(cBuffer);
	
	//------


}

function draw_lines(strLevel){
	var cCenter = [vec4( 0, -0.5, 0, 1),vec4( 0, -1.5, 0, 1),		//verticle line
					vec4( -treeDisplacementX-0.2, -1.5, 0, 1),vec4( treeDisplacementX+0.2, -1.5, 0, 1),		//horzontal line
					vec4( -treeDisplacementX, -1.5, 0, 1),vec4( -treeDisplacementX, -2, 0, 1),	//right verticle line
					vec4( treeDisplacementX, -1.5, 0, 1),vec4( treeDisplacementX, -2, 0, 1)];	//left verticle line
	var cColor = [];
	for(var i = 0; i < cCenter.length; i++)
	{
		cColor.push(vec4(1,1,1,1));
	}

	var pBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(cCenter), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(program,  "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);		//Turns the attribute on
	
	var cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(cColor), gl.STATIC_DRAW);
	//Get the location of the shader's vColor attribute in the GPU's memory
	var vColor= gl.getAttribLocation(program,  "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);//Turns the attribute on
	gl.drawArrays(gl.LINES, 0,8);
	gl.deleteBuffer(pBuffer);
	gl.deleteBuffer(cBuffer);
}

function quad(a, b, c, d)
{
    var verts = [];

    var vertices = [
        vec4( -0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5, -0.5, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5, -0.5, -0.5, 1.0 )
    ];

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i )
    {
        verts.push( vertices[indices[i]] );
    }
    return verts;
}
