/*
 * Some comments quoted from WebGL Programming Guide
 * by Matsuda and Lea, 1st edition.
 * 
 * @author Peter Subacz
 * 
 * using multiple draw calls example: https://webglfundamentals.org/webgl/lessons/webgl-less-code-more-fun.html
 * strats to draw multiple objects to a screen: 
 * 
 * This program allows a user to upload a ply file and draw that file as a polygon mesh to the screen. The mesh
 * 	can then be translated in the x,y, or z direction as well as be rotated around the roll, pitch, and yaw
 * 	axis. 
 * 
 * A breathing animation can be enabled that will displace a polygon about its surface normal. 
 * 
 * Note: this program is extremely computationally heavy with regards to the breathing animation.
 * 
 * features:
 *  Parse a .ply file 
 * 	Translate around the XYZ:
 * 		Press ' X ' or ' x ' Translate your wireframe in the + x
 * 		Press ' C ' or ' c ' Translate your wireframe in the - x
 * 		Press ' y ' or ' y ' Translate your wireframe in the + y
 * 		Press ' U ' or ' u ' Translate your wireframe in the - y
 * 		Press ' Z ' or ' z ' Translate your wireframe in the + z
 * 		Press ' A ' or ' a ' Translate your wireframe in the - z
 * 	Rotate around the Roll,Pitch,Yaw
 * 		Press ' R ' or ' r ' Rotate your wireframe in an + Roll
 * 		Press ' R ' or ' r ' Rotate your wireframe in an + Roll
 * 		Press ' T ' or ' T ' Rotate your wireframe in an - Pitch
 * 		Press ' O ' or ' o ' Rotate your wireframe in an + Pitch
 * 		Press ' K ' or ' k ' Rotate your wireframe in an + Yaw
 * 		Press ' L ' or ' l ' Rotate your wireframe in an - Yaw
 * 	Breathing animation
 * 		Press ' B ' or ' b ' to toggle the breathing (pulsing).
 * 	Draw normal lines
 * 		Press ' D ' or ' d ' to toggle the normal lines.
 * 	Randomize colors
 * 		Press ' E ' or ' e ' to randomize the line colors
 * 	Reset rotations and Translations
 * 		Press ' Q ' or ' q ' to turn off active modes.
 * 		Press ' W ' or ' w ' to reset model to origin.
 */
var gl;	//webgl
var id; //animation id

var fovy = 60.0;  // Field-of-view in Y direction angle (in degrees)
var aspect;       // Viewport aspect ratio
var program;

var mvMatrix, pMatrix;
var modelView, projection;
var eye;

var stack = []; //Hierarchy model stack

//cubes 
var normalsArrayCube = [];
var theCube = cube();

//spheres
var numTimesToSubdivide = 5;
var pointsArray = [];
var normalsArraySphere = [];
var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);

//tree size
var numberOfBranches = 3;		//number of subtrees within 
var treeDisplacementX = 2.5;
var treeDisplacementY = 2.5;
var treeDisplacementZ = 0;
var treeLineDecay = 1.5;

//lighting location
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );


var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 20.0;

var diffuseProduct;
var specularProduct;
var diffuseProduct;


//yaw rotation variables
var beta = 0;
//control booleans
var animation = true;

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

	diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    ambientProduct = mult(lightAmbient, materialAmbient);

	tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

	projection = gl.getUniformLocation(program, "projectionMatrix");
	modelView = gl.getUniformLocation(program, "modelMatrix");
	var offsetLoc = gl.getUniformLocation(program, "vPointSize");
	gl.uniform1f(offsetLoc, 7.5);

	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
	projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix");
	
	render();
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

	modelViewMatrix = mvMatrix; 

	gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

	
	computeHierarchyModel();

	if (animation){ //recursive animation 
		id = requestAnimationFrame(render);
	}
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
	drawSphere();

	treeDisplacementX = 10;
	attach_subtrees(numberOfBranches);
}

function attach_subtrees(numberOfBranches){
	/* 
		Recusively attach lower leveled objects.
	*/

	stack.push(mvMatrix); 
	treeDisplacementX /=2;
	if(numberOfBranches>0){
		draw_lines();
		if (stack.length%2>0){
			//draw the right object 
			mvMatrix = mult(mvMatrix, translate(treeDisplacementX, -treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix, rotateY(2*beta));
			gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix));
			draw_cube();
			attach_subtrees(numberOfBranches-1);
			//draw the left object 
			mvMatrix = mult(mvMatrix, rotateY(-2*beta));
			mvMatrix = mult(mvMatrix,translate(-treeDisplacementX, treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix,translate(-treeDisplacementX, -treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix, rotateY(2*beta));
			gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
			draw_cube();
			attach_subtrees(numberOfBranches-1);
		}else{
			//draw the right object
			mvMatrix = mult(mvMatrix, translate(treeDisplacementX, -treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix, rotateY(-2*beta));
			gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix));
			drawSphere();
			attach_subtrees(numberOfBranches-1);
			// draw the left object 
			mvMatrix = mult(mvMatrix, rotateY(2*beta));
			mvMatrix = mult(mvMatrix,translate(-treeDisplacementX, treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix,translate(-treeDisplacementX, -treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix, rotateY(-2*beta));
			gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix));
			drawSphere();
			attach_subtrees(numberOfBranches-1);
		}
	}
	treeDisplacementX*=2;
	mvMatrix = stack.pop();
}

function draw_cube(color){
    var fragColors = [];

    for(var i = 0; i < theCube.length; i++)
    {
        fragColors.push(color);
    }

    var pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(theCube), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program,  "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

	var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArrayCube), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

	gl.drawArrays( gl.TRIANGLES, 0, theCube.length);

	gl.deleteBuffer(pBuffer);
	gl.deleteBuffer(nBuffer);
}

function drawSphere(color)
{
	var fragColors = [];

    for(var i = 0; i < pointsArray.length; i++)
    {
        fragColors.push(color);
	}
	
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArraySphere), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	gl.drawArrays( gl.TRIANGLES, 0, pointsArray.length );
	gl.deleteBuffer(vBuffer);
	gl.deleteBuffer(nBuffer);
}

function draw_lines(){
	var cCenter = [vec4( 0, -0.5, 0, 1),vec4( 0, -1.5, 0, 1),		//verticle line
					vec4( -treeDisplacementX-0.2, -1.5, 0, 1),vec4( treeDisplacementX+0.2, -1.5, 0, 1),		//horzontal line
					vec4( -treeDisplacementX, -1.5, 0, 1),vec4( -treeDisplacementX, -2, 0, 1),	//right verticle line
					vec4( treeDisplacementX, -1.5, 0, 1),vec4( treeDisplacementX, -2, 0, 1)];	//left verticle line

	var cColor = [vec4( 0, -0.5, 0, 1),vec4( 0, -1.5, 0, 1),		//verticle line
		vec4( -treeDisplacementX-0.2, -1.5, 0, 1),vec4( treeDisplacementX+0.2, -1.5, 0, 1),		//horzontal line
		vec4( -treeDisplacementX, -1.5, 0, 1),vec4( -treeDisplacementX, -2, 0, 1),	//right verticle line
		vec4( treeDisplacementX, -1.5, 0, 1),vec4( treeDisplacementX, -2, 0, 1)];	//left verticle line

	var pBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(cCenter), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(program,  "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);		//Turns the attribute on
	
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(cColor), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal)

	gl.drawArrays(gl.LINES, 0,8);
	gl.deleteBuffer(pBuffer);
	gl.deleteBuffer(nBuffer);
}

function cube(){
    var verts = [];
    verts = verts.concat(quad( 1, 0, 3, 2 ));
    verts = verts.concat(quad( 2, 3, 7, 6 ));
    verts = verts.concat(quad( 3, 0, 4, 7 ));
    verts = verts.concat(quad( 6, 5, 1, 2 ));
    verts = verts.concat(quad( 4, 5, 6, 7 ));
	verts = verts.concat(quad( 5, 4, 0, 1 ));

	//compute normals
	var i = 0;
	while(i<verts.length){
		normalsArrayCube.push(vec4(verts[i][0],verts[i][1],verts[i][2],0));
		i+=1;
	}
	return verts;
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

function triangle(a, b, c)
{
     pointsArray.push(a);
     pointsArray.push(b);
     pointsArray.push(c);

     // normals are vectors

     normalsArraySphere.push(a[0],a[1], a[2], 0.0);
     normalsArraySphere.push(b[0],b[1], b[2], 0.0);
     normalsArraySphere.push(c[0],c[1], c[2], 0.0);

}

function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {

        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else {
        triangle( a, b, c );
    }
}

function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

function normal_newell_method(vectors){
	/*
		Computes the normal via the newwell method for the m_x, m_y, and m_z

		returns [m_x,m_y,m_z]
	*/

	var normal = vec3(0.0,0.0,0.0); // [m_x,m_y,m_z]

	//mx - sum(y-y_1)*(z+z_1)
	var sum = 0;
		for(ii=0;ii<vectors.length-1;ii++){	
			sum += (vectors[ii][1]-vectors[ii+1][1])*
				(vectors[ii][2]+vectors[ii+1][2]);	
		}
	normal[0] = sum;
	//my - sum(z-z_1)*(x+x_1)
	var sum = 0;
		for(ii=0;ii<vectors.length-1;ii++){	
			sum += (vectors[ii][2]-vectors[ii+1][2])*
				(vectors[ii][0]+vectors[ii+1][0]);		
		}
	normal[1] = sum
	
	//mz - sum(x-x_1)*(y+y_1)
	var sum = 0;
		for(ii=0;ii<vectors.length-1;ii++){	
			sum += (vectors[ii][0]-vectors[ii+1][0])*
				(vectors[ii][1]+vectors[ii+1][1]);	
		}
	normal[2] = sum;	
	return normal;
}