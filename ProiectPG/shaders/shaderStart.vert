#version 410 core

layout(location=0) in vec3 vPosition;
layout(location=1) in vec3 vNormal;
layout(location=2) in vec2 vTexCoords;

out vec3 fPosition;
out vec3 fNormal;
out vec2 fTexCoords;
out vec4 fragPosLightSpace;

out vec4 lightPosEye;
out vec4 lightPosEyeHeli;
out vec4 lightPosEyeYacht;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform	mat3 normalMatrix;
uniform mat4 lightSpaceTrMatrix;

void main() 
{

	fragPosLightSpace = lightSpaceTrMatrix * model * vec4(vPosition, 1.0f);
	lightPosEye = view* model * vec4(-12.209f, 11.018f, -2.3065f, 1);
	lightPosEyeHeli = view* model * vec4(-137.1f, 6.568f, -53.669f, 1);
	lightPosEyeYacht = view* model * vec4(-13.0f, 2.0f, 225.0f, 1);

	fPosition = vPosition;
	fNormal = vNormal;
	fTexCoords = vTexCoords;	
	gl_Position = projection * view * model * vec4(vPosition, 1.0f);

}
