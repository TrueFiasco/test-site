// Pixel Shader
float cro(in vec2 a, in vec2 b ) { return a.x*b.y - a.y*b.x; }
    
float sdUnevenCapsule( in vec2 p, in vec2 pa, in vec2 pb, in float ra, in float rb )
{
    p  -= pa;
    pb -= pa;
    float h = dot(pb,pb);
    vec2  q = vec2( dot(p,vec2(pb.y,-pb.x)), dot(p,pb) )/h;
    
    //-----------
    
    q.x = abs(q.x);
    
    float b = ra-rb;
    vec2  c = vec2(sqrt(h-b*b),b);
    
    float k = cro(c,q);
    float m = dot(c,q);
    float n = dot(q,q);
    
         if( k < 0.0 ) return sqrt(h*(n            )) - ra;
    else if( k > c.x ) return sqrt(h*(n+1.0-2.0*q.y)) - rb;
                       return m                       - ra;
}


out vec4 fragColor;

void main()
{
	// Get the UV coordinates of the current pixel
	vec2 p = vUV.st;  // Pixel coordinates (0 to 1 range)

	float minDist = 1e10; // Initialize with a large value

	// Get the texture size of the first input
	ivec2 texSize = textureSize(sTD2DInputs[0], 0);

	// Iterate over each line segment in the texture
	for (int i = 0; i < texSize.x; i++) // Adjusted to iterate horizontally if needed
	{
		// Fetch line segment points from the input texture
		vec4 line = texelFetch(sTD2DInputs[0], ivec2(i, 0), 0); // Line data: p0.x, p0.y, p1.x, p1.y
		vec2 width = vec2(0.15, 0.15);
		vec2 uPoint0 = line.xy;
		vec2 uPoint1 = line.zw;
		vec2 v1 = line.xy;
		vec2 v2 = line.zw;
		float r1 = width.r/20;
		float r2 = width.g/20;
		
		float d = sdUnevenCapsule( p, v2, v1, r2, r1 );

		// Calculate the distance from the pixel to the closest point on the segment
		float dist = length(p - d);

		// Keep track of the minimum distance
		minDist = min(minDist, d);
	}

	// Output the minimum distance as a grayscale value
	fragColor = vec4(vec3(minDist), 1.0);
}

