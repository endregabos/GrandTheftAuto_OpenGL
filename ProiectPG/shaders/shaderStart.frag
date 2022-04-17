#version 410 core

in vec3 fPosition;
in vec3 fNormal;
in vec2 fTexCoords;
in vec4 lightPosEye;
in vec4 lightPosEyeHeli;
in vec4 lightPosEyeYacht;

out vec4 fColor;

//matrices
uniform mat4 model;
uniform mat4 view;
uniform mat3 normalMatrix;
//lighting
uniform vec3 lightDir;
uniform vec3 lightColor;
uniform vec3 streetLight;
// textures
uniform sampler2D diffuseTexture;
uniform sampler2D specularTexture;

//components
vec3 ambient;
float ambientStrength = 0.2f;
vec3 diffuse;
vec3 specular;

vec3 diffuseStreet;
vec3 specularStreet;
vec3 specularUniv;
vec3 diffuseHeli;
vec3 specularHeli;
vec3 diffuseYacht;
vec3 specularYacht;
float specularStrength = 0.5f;

in vec4 fragPosLightSpace;
uniform sampler2D shadowMap;

uniform int fog;

float computeShadow()
{
    vec3 normalizedCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    if(normalizedCoords.z > 1.0f)
        return 0.0f;
    normalizedCoords = normalizedCoords * 0.5f + 0.5f;
    float closestDepth = texture(shadowMap, normalizedCoords.xy).r;    

    float currentDepth = normalizedCoords.z;
    float bias = 0.005f;
    float shadow = currentDepth - bias> closestDepth  ? 1.0f : 0.0f;

    return shadow;	
}

float computeFog(){

    vec4 fPosEye = view * model * vec4(fPosition, 1.0f);
    float fogDensity=0.03f;
    float fragmentDistance = length(fPosEye);
    float fogFactor = exp(-pow(fragmentDistance*fogDensity,2));

    return clamp(fogFactor,0.0f,1.0f);
}


void computeDirLight()
{
   	vec3 cameraPosEye = vec3(0.0f);//in eye coordinates, the viewer is situated at the origin

    //compute eye space coordinates
    vec4 fPosEye = view * model * vec4(fPosition, 1.0f);
    vec3 normalEye = normalize(normalMatrix * fNormal);

    //normalize light direction

    vec3 lightDirN = vec3(normalize(lightPosEye.xyz - fPosEye.xyz));
	vec3 lightDirNHeli = vec3(normalize(lightPosEyeHeli.xyz - fPosEye.xyz));
	vec3 lightDirNYacht = vec3(normalize(lightPosEyeYacht.xyz - fPosEye.xyz));

    float constant = 1.0f;
    float linear = 0.022f; float quadratic = 0.0019f;
    float dist = length(lightPosEye.xyz - fPosEye.xyz);
	float distHeli = length(lightPosEyeHeli.xyz - fPosEye.xyz);
	float distYacht = length(lightPosEyeYacht.xyz - fPosEye.xyz);

    float att = 1.0f / (constant + linear * dist + quadratic * (dist * dist));
	float attStreet = 1.0f / (constant + 0.09f * dist + 0.032f * (dist * dist));
	float attHeli = 1.0f / (constant + 0.09f * distHeli + 0.032f * (distHeli * distHeli));
	float attYacht = 1.0f / (constant + 0.09f * distYacht + 0.032f * (distYacht * distYacht));

    //compute view direction (in eye coordinates, the viewer is situated at the origin
    vec3 viewDir = normalize(- fPosEye.xyz);

    //compute ambient light
    ambient = att*ambientStrength * lightColor;

    //compute diffuse light
    diffuse = att*max(dot(normalEye, lightDirN), 0.0f) * lightColor;
	diffuseStreet = attStreet*max(dot(normalEye, lightDirN), 0.0f) * streetLight;
	diffuseHeli = attHeli*max(dot(normalEye, lightDirNHeli), 0.0f) * streetLight;
	diffuseYacht = attYacht * max(dot(normalEye, lightDirNYacht), 0.0f) * vec3(0.0f, 0.0f, 1.0f);

    //compute specular light
    vec3 reflectDir = reflect(-lightDirN, normalEye);
    float specCoeff = pow(max(dot(viewDir, reflectDir), 0.0f), 32);

    specular = att*specularStrength * specCoeff * lightColor;
	specularStreet = attStreet*specularStrength * specCoeff * streetLight;
	specularHeli = attHeli*specularStrength * specCoeff * streetLight;
	specularYacht = attYacht*specularStrength * specCoeff * vec3(0.0f, 0.0f, 1.0f);

}
void computeLightComponents()
{	
   
    vec4 fPosEye = view * model * vec4(fPosition, 1.0f);

	vec3 cameraPosEye = vec3(0.0f);//in eye coordinates, the viewer is situated at the origin
	
	//transform normal
	vec3 normalEye = normalize(fNormal);	
	
	//compute light direction
	vec3 lightDirN = normalize(lightDir);
	vec3 lightDirNHeli = normalize(lightDir);
	vec3 lightDirNYacht = normalize(lightDir);

	//compute view direction 
	vec3 viewDirN = normalize(cameraPosEye - fPosEye.xyz);
		
	//compute ambient light
    ambient = ambientStrength * lightColor;
	
	//compute diffuse light
	diffuse = max(dot(normalEye, lightDirN), 0.0f) * lightColor;
	diffuseStreet = max(dot(normalEye, lightDirN), 0.0f) * streetLight;
	diffuseHeli = max(dot(normalEye, lightDirNHeli), 0.0f) * streetLight;
	diffuseYacht = max(dot(normalEye, lightDirNYacht), 0.0f) * vec3(0.0f, 0.0f, 1.0f);

	//compute specular light
	vec3 reflection = reflect(-lightDirN, normalEye);
	float specCoeff = pow(max(dot(viewDirN, reflection), 0.0f), 32);
	specularUniv = specularStrength * specCoeff * lightColor;
}
void main() 
{ 
    computeLightComponents();
    computeDirLight();
   
    //compute final vertex color
    float fogFactor = computeFog();
    vec4 fogColor=vec4(0.5f,0.5f,0.5f,1.0f);
	float shadow = computeShadow();
    vec3 color = min((ambient + (1.0f - shadow)*(diffuse + diffuseStreet + diffuseHeli + diffuseYacht)) * texture(diffuseTexture, fTexCoords).rgb + (1.0f - shadow)*(specular + specularStreet + specularHeli + specularYacht)* texture(specularTexture, fTexCoords).rgb, 1.0f);
    //vec3 color = min((ambient + (1.0f - shadow)*(diffuseStreet)) * texture(diffuseTexture, fTexCoords).rgb + (1.0f - shadow)*(specularStreet)* texture(specularTexture, fTexCoords).rgb, 1.0f);


	if(fog == 1){
		fColor = fogColor * (1 - fogFactor) +  vec4(color, 1.0f)* fogFactor;
	}
	else{
		fColor = vec4(color, 1.0f);
	}
	
}
