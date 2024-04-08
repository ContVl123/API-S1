'use strict';
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');

const swaggerUi = require('swagger-ui-express');
const swaggerValidation = require('openapi-validator-middleware');
const mongoose = require('mongoose');

const reqDeclaraciones = require('./api/reqDeclaraciones.json');

const Ajv = require('ajv');
const localize  =  { 
	es : require ('./node_modules/ajv-i18n/localize/es'),  
}

const jsyaml = require('js-yaml');
const fs = require('fs');
const { post_declaraciones } = require('./controllers/Declaraciones');
var cors = require('cors');
/************ Mongo DB ******************/
const url = `mongodb://${process.env.USERMONGO}:${process.env.PASSWORDMONGO}@${process.env.HOSTMONGO}/${process.env.DATABASE}`;

const db = mongoose
	.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => console.log('Conexión a base de datos MongoDB...\t\t(Exitosa!!!)'))
	.catch((err) => console.log(`Conexión a base de datos MongoDB...\t\t(${err})`));
/************ Mongo DB ******************/

const standar = 'api/OAPI-declaraciones.json';
const spec = fs.readFileSync(standar, 'utf8');
const swaggerDoc = jsyaml.safeLoad(spec);

const serverPort = 9005;

let declaraciones_auth = swaggerDoc.components.securitySchemes.declaraciones_auth;

swaggerDoc.components.securitySchemes = {
	declaraciones_auth,
	BearerAuth: {
		type: 'http',
		scheme: 'bearer',
		bearerFormat: 'JWT'
	}
};

let declara_inicial = '/v2/declaraciones';
swaggerDoc.paths[declara_inicial].post.security.push({ BearerAuth: [] });

swaggerValidation.init(swaggerDoc);
const app = express();
app.use(bodyParser.json());

app.use((req, res, next) => {
	const ajv = new Ajv({ allErrors: true });

	ajv.addKeyword("page");
	ajv.addKeyword("example");
	ajv.addKeyword("pageSize");
	ajv.addKeyword("sort");
	ajv.addKeyword("query");

	const validate = ajv.compile(reqDeclaraciones);

	var valid = validate(req.body); //<- Este dato es que valida (checarlo)

	console.log("req.body - middlaware - valid <---------------------------");
	console.log(req.body);
	console.log("valor de valid");
	console.log(valid);

	if (!valid) {
		localize.es(validate.errors);
		
		let errores = validate.errors.map(({ message, dataPath }) => `${dataPath.slice(1)}: ${message}`);

		res.statusCode = 400;
		next({ status: 400, errores: errores.join(' | ') });
		return;
	}
	next();
});


//Routes
app.use(cors({origin:'*'}));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
app.post('/v2/declaraciones', swaggerValidation.validate, post_declaraciones);

// app.use((err, req, res, next) => {
// 	res.status(err.status || 500).json({
// 		code: err.status || 500,
// 		message: err.errores
// 	});
// });

http.createServer(app).listen(serverPort, () => {
	console.log(`Servidor iniciado...\t\t\t\t(http://localhost:${serverPort})`);
	console.log(`Documentacion Swagger disponible...\t\t(http://localhost:${serverPort}/docs)`);
});