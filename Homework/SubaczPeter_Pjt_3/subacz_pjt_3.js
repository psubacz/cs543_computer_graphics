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

var theta = 0;
function modelRotations(){
	theta +=1
	if (360%theta==1){
		theta = 0;
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
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

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
						|
					o-------o		level 2 objects
					|
				o-------o			level 3 objects

		0. Reset: All objects start out as centered, the 0th object is translated 
			to the top 
		1. Draw lines: Vertical and horzontal lines are drawn from the parent level 
			to the child level.
		2. Child objects are then translated to the ends of the horzontal lines in
			step 1
		3. Repeat steps 1 & 2 for each level.
	*/
	
	modelRotations();			//increment rotation angle
	//Level 0 objects
	
	stack.push(mvMatrix); 	
	mvMatrix = mult(mvMatrix,rotateY(-theta));//rotations 
	gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix));
	draw_object(theCube, vec4(1.0, 0.0, 0.0, 1.0));
	draw_lines()
	attach_subtree()
	draw_lines()
	attach_subtree()
	draw_lines()
	attach_subtree()
	mvMatrix = stack.pop();
	mvMatrix = stack.pop();
	mvMatrix = stack.pop();

			//level 2 objects
			// stack.push(mvMatrix);
			// mvMatrix = mult(mvMatrix,translate(1.5, -2.5, 0));
			// mvMatrix = mult(mvMatrix, rotateY(-2*theta));
			// gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
			// draw_object(theCube, vec4(0.0, 1.0, 0.0, 1.0));
			// // draw_lines()

			// // //level 3 obects
			// // stack.push(mvMatrix);
			// // 	mvMatrix = mult(mvMatrix,translate(1.5, -2.5, 0));
			// // 	mvMatrix = mult(mvMatrix, rotateY(2*theta));
			// // 	gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
			// // 	draw_object(theCube, vec4(0.0, 1.0, 0.0, 1.0));
			// // 	mvMatrix = mult(mvMatrix, rotateY(-2*theta));
			// // 	mvMatrix = mult(mvMatrix,translate(-1.5, 2.5, 0));
			// // 	mvMatrix = mult(mvMatrix,translate(-1.5, -2.5, 0));
			// // 	mvMatrix = mult(mvMatrix, rotateY(2*theta));
			// // 	gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
			// // 	draw_object(theCube, vec4(0.0, 0.0, 1.0, 1.0));
			// // mvMatrix = stack.pop();

			// mvMatrix = mult(mvMatrix, rotateY(2*theta));
			// mvMatrix = mult(mvMatrix,translate(-1.5, 2.5, 0));
			// mvMatrix = mult(mvMatrix,translate(-1.5, -2.5, 0));
			// mvMatrix = mult(mvMatrix, rotateY(-2*theta));
			// gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
			// draw_object(theCube, vec4(0.0, 0.0, 1.0, 1.0));

		// 	mvMatrix = stack.pop();
		// mvMatrix = stack.pop();
	mvMatrix = stack.pop();
}

function attach_subtree(){
	//Level 1 objects
	stack.push(mvMatrix);
	mvMatrix = mult(mvMatrix,translate(1.5, -2.5, 0));
	mvMatrix = mult(mvMatrix, rotateY(2*theta));
	gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
	draw_object(theCube, vec4(0.0, 1.0, 0.0, 1.0));

	mvMatrix = mult(mvMatrix, rotateY(-2*theta));
	mvMatrix = mult(mvMatrix,translate(-1.5, 2.5, 0));
	mvMatrix = mult(mvMatrix,translate(-1.5, -2.5, 0));
	mvMatrix = mult(mvMatrix, rotateY(2*theta));
	gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
	draw_object(theCube, vec4(0.0, 0.0, 1.0, 1.0));


}

function render()
{

	aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	
    pMatrix = perspective(fovy, aspect, 0.001, 50);
	gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );
	
	eye = vec3(0, -5, -10);
	at = vec3(0.0, -5.0, 0.0);
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

		var cCenter = [vec4( 0, -0.5, 0, 1),vec4( 0, -1.5, 0, 1),		//verticle
						vec4( -2, -1.5, 0, 1),vec4( 2, -1.5, 0, 1),	//left 
						vec4( -1.5, -1.5, 0, 1),vec4( -1.5, -2, 0, 1),	//right
						vec4( 2, -1.5, 0, 1),vec4( 2, -2, 0, 1)];	
		var cColor = [];
		for(var i = 0; i < cCenter.length; i++)
		{
			cColor.push(vec4(0,0,0,1));
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
