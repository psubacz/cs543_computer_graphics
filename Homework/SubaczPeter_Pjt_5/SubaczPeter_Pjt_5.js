var program;


function configure_image_one(){
    var canvas = document.getElementById('webgl');
    program = initShaders(gl, "vshader", "fshader0");
    gl.useProgram(program);
    gl.viewport( 0, 0, canvas.width, canvas.height );
    // Set clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    render()
    
}

function configure_image_two(){
    var canvas = document.getElementById('webgl');
    program = initShaders(gl, "vshader", "fshader1");
    gl.useProgram(program);
    gl.viewport( 0, 0, canvas.width, canvas.height );
    // Set clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    render()
}

function configure_image_three(){
    var canvas = document.getElementById('webgl');
    program = initShaders(gl, "vshader", "fshader2");
    gl.useProgram(program);
    gl.viewport( 0, 0, canvas.width, canvas.height );
    // Set clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    render()
}

function render(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var buffer = gl.createBuffer();

    // Create a square as a strip of two triangles.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -1,1,
            0,1,
            1,0,
            -1,-1,
            0,1,
            -1,0]),
        gl.STATIC_DRAW
    );
    // obs
    gl.aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(gl.aPosition);
    gl.vertexAttribPointer(gl.aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function main()
{
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = WebGLUtils.setupWebGL(canvas, undefined);
    if (!gl)
    {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    configure_image_one();
}