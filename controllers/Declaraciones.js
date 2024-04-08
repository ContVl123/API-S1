'use strict';

var utils = require('../utils/writer.js');
var Declaracion = require('../service/DeclaracionService');
var jwt = require('jsonwebtoken');
require('dotenv').config({path: './utils/.env'});

var validateToken = function(req){
    var inToken = null;
    var auth = req.headers['authorization'];
    if (auth && auth.toLowerCase().indexOf('bearer') == 0) {
        inToken = auth.slice('bearer '.length);
    } else if (req.body && req.body.access_token) {
        inToken = req.body.access_token;
    } else if (req.query && req.query.access_token) {
        inToken = req.query.access_token;
    }
    // invalid token - synchronous
    try {
        var decoded =  jwt.verify(inToken, process.env.SEED );
        return {code: 200, message: decoded};
    } catch(err) {
        // err
        let error="" ;
        if (err.message === "jwt must be provided"){
            error = "Error el token de autenticación (JWT) es requerido en el header, favor de verificar"
        }else if(err.message === "invalid signature" || err.message.includes("Unexpected token")){
            error = "Error token inválido, el token probablemente ha sido modificado favor de verificar"
        }else if (err.message ==="jwt expired"){
            error = "Error el token de autenticación (JWT) ha expirado, favor de enviar uno válido "
        }else {
            error = err.message;
        }

        let obj = {code: 401, message: error};
        return obj;
    }
}

module.exports.post_declaraciones = function post_declaraciones (req, res, next) {

    let { body } = req;

	if (!('page' in body)) body.page = 1;
	if (!('pageSize' in body)) body.pageSize = 10;

    console.log("entrando a post_declaraciones");

    var code = validateToken(req);
    if(code.code == 401){
        res.status(401).json({code: '401', message: code.message});
        console.log("entrando al error 401");
    }else if (code.code == 200 ){
        console.log("entrando al status 200");
        Declaracion.post_declaraciones(body)
            .then(function (response) {
                utils.writeJson(res, response);
            })
            .catch(function (response) {
                if(response.message === "request.body.query.escolaridad.Nivel should be array"){
                    console.log("entrando al error 422 - aaquiii 111");
                    res.status(422).json({code: '422', message:  "Error el campo escolaridadNivel tiene que ser un arreglo"});
                }
                if(response.message === "request.body.query.escolaridadNivel[0] should be <= 5"){
                    console.log("entrando al error 422 - aaquiii 222");
                    res.status(422).json({code: '422', message:  response.message});
                }
                if(response instanceof  RangeError){
                    res.status(422).json({code: '422', message:  response.message});
                }else if (response instanceof  SyntaxError){
                    res.status(422).json({code: '422', message:  response.message});
                }
            });
    }
};