'use strict';
var _ = require('underscore');
var { Declaracion } = require('../utils/models');
var ObjectId = require('mongoose').Types.ObjectId;

function diacriticSensitiveRegex(string = '') {
    string = string.toLowerCase().replace("ñ","#");
    string = string.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return string.replace(/a/g, '[a,á,à,ä]')
        .replace(/e/g, '[e,é,ë]')
        .replace(/i/g, '[i,í,ï]')
        .replace(/o/g, '[o,ó,ö,ò]')
        .replace(/u/g, '[u,ü,ú,ù]')
        .replace(/#/g,"ñ");
}

let paisNacionalidad = require('./paises');

const getProp = (obj, key) =>
key.split('.').reduce( (o, x) =>
                      (typeof o == "undefined" || o === null) ? o : o[x]
                      , obj);

async function post_declaraciones (body) {
    let sortObj = body.sort  === undefined ? {} : body.sort;
    let page = body.page;  //numero de pagina a mostrar
    let pageSize = body.pageSize;
    let query = body.query === undefined ? {} : body.query;

    console.log(" ");
    //console.log("********************** INICIO DE PROCEDIMIENTO ********************** ");
    console.log("Valor 'query' ");
    console.log(query);
    console.log("Valor 'sortObj'");
    console.log(sortObj);
    console.log('----------------');
    //console.log("entré a post_declaracion - aquiiiii");
    console.log("Valor 'page': "+page);
    console.log("Valor 'pagesize': "+pageSize);

    if(page <= 0 ){
        throw new RangeError("'page' fuera de rango");
    }else{
        let newQuery={};
        let newSort={};        

        console.log("Valor 'newQuery'");
        console.log(newQuery);
        console.log("Valor 'newSort'");
        console.log(newSort);
        //console.log("cuantos elementos del primer array para ordenar los datos - PRINCIPIO")
        console.log("Valor 'sortObj'");
        console.log(Object.entries(sortObj))
        
        console.log("---------Datos de Sort-----------");
        for (let [key, value] of Object.entries(sortObj)) {
            
            console.log(`  Valor 'key': (${key})`);
            console.log(key);
            console.log(`  Valor 'value': (${value})`);
            console.log(value);

            if(key === "nombres"){
                newSort["datosGenerales.nombre"] = value                
            }
            if(key === "primerApellido"){
                newSort["datosGenerales."+key] = value
            }
            if(key === "segundoApellido"){                
                newSort["datosGenerales."+key] = value
            }
            if(key === "escolaridadNivel"){
                newSort["datosCurricularesDeclarante.escolaridad.nivel.clave"] = value;
            }
            if(key === "datosEmpleoCargoComision"){
                if( typeof value.nombreEntePublico != 'undefined' ){
                    newSort[key+".nombreEntePublico"] = value.nombreEntePublico;
                }
                if( typeof value.entidadFederativa != 'undefined' ){
                    newSort[key+".domicilioMexico.entidadFederativa.clave"] = value.entidadFederativa;
                }
                if( typeof value.municipioAlcaldia != 'undefined' ){
                    newSort[key+".domicilioMexico.municipioAlcaldia.clave"] = value.municipioAlcaldia;
                }
                if( typeof value.empleoCargoComision != 'undefined' ){
                    newSort[key+".empleoCargoComision"] = value.empleoCargoComision;
                }
                if( typeof value.nivelOrdenGobierno != 'undefined' ){
                    newSort[key+".nivelOrdenGobierno"] = value.nivelOrdenGobierno;
                }
                if( typeof value.nivelEmpleoCargoComision!= 'undefined' ){
                    newSort[key+".nivelEmpleoCargoComision"] = value.nivelEmpleoCargoComision;
                }
            }            
            if(key == "totalIngresosNetos"){
                //newSort["ingresos.totalIngresosMensualesNetos.valor"]= value                
                newSort["ingresos.ingresoMensualNetoDeclarante.valor"]= value;                
            }
            if(key === "bienesInmuebles"){
              
                if( typeof value.superficieConstruccion != 'undefined' ){
                     newSort[key+".bienInmueble.superficieConstruccion.valor"] = value.superficieConstruccion;                                                                 
                }
                if( typeof value.superficieTerreno != 'undefined' ){
                    newSort[key+".bienInmueble.superficieTerreno.valor"] = value.superficieTerreno;                                                          
                }
                if( typeof value.formaAdquisicion != 'undefined' ){
                    newSort[key+".bienInmueble.formaAdquisicion.clave"] = value.formaAdquisicion;
               } 
               if( typeof value.valorAdquisicion != 'undefined' ){
                newSort[key+".bienInmueble.valorAdquisicion.valor"] = value.valorAdquisicion;                                                                  
                }

            }
        }        

        //console.log("cuantos elementos del primer array para ordenar los datos - FINAL")
        //console.log(Object.entries(query))            

        newQuery["firmada"] = true; 
        newQuery["datosEmpleoCargoComision"]= { $exists: true }
        newQuery["experienciaLaboral"]= { $exists: true }
        newQuery["datosGenerales"]= { $exists: true }
        let vMenor=null;
        let vMayor=null;
        console.log("---------Datos de newQuery-------");
        for (let [key, value] of Object.entries(query)) {

            console.log(`  Valor 'key': (${key})`);
            console.log(`  Valor 'value': (${value})`);
            console.log(value);
            console.log(`  Valor 'value.length': ${value.length}`);
            
            if(key === 'id'){           
                if((value.trim().length || 0) > 0){                    
                    if(ObjectId.isValid(value)){
                        newQuery["_id"] = value;
                    }else{
                        newQuery["_id"] = null;
                    }  
                }
            }else if(key === "segundoApellido"){
                
                if(value !== "" ){
                    newQuery["datosGenerales."+key] = { $regex : diacriticSensitiveRegex(value),  $options : 'i'};
                }                
            }else if(key === "primerApellido"){
                newQuery["datosGenerales."+key] = { $regex : diacriticSensitiveRegex(value),  $options : 'i'};
            }else if(key === 'nombres' ){
                newQuery["datosGenerales.nombre"] = {$regex: diacriticSensitiveRegex(value), $options: 'i'};                
            }else if(key === "escolaridadNivel"){
                //console.log(`  Valor del length en escolaridad ${value.length}`);
                //console.log(value);
                if(value !== "" ){
                    newQuery["datosCurricularesDeclarante.escolaridad.nivel.valor"] = { $regex : diacriticSensitiveRegex(value),  $options : 'i'}
                }                
                  
            }else if(key === 'datosEmpleoCargoComision'){                
                //console.log(`  Entré al if de ${key}.nombreEntePublico`);
                //console.log(value);
                if(typeof value.nombreEntePublico != 'undefined'){
                    if(value.nombreEntePublico !== "" ){
                        newQuery[key+".nombreEntePublico"] = { $regex : diacriticSensitiveRegex(value.nombreEntePublico),  $options : 'i'};
                    }                    
                }                                                                
                if(typeof value.entidadFederativa != 'undefined'){       
                    if(value.entidadFederativa !== "" ){
                        newQuery[key+".domicilioMexico.entidadFederativa.clave"]={ $regex : diacriticSensitiveRegex(value.entidadFederativa),  $options : 'i'};
                    }                           
                }                
                if(typeof value.municipioAlcaldia != 'undefined'){
                    if(value.municipioAlcaldia !== "" ){
                        newQuery[key+".domicilioMexico.municipioAlcaldia.clave"]={ $regex : diacriticSensitiveRegex(value.municipioAlcaldia),  $options : 'i'};
                    }
                }                
                                                           
                if(typeof value.empleoCargoComision != 'undefined'){
                    if(value.empleoCargoComision !== "" ){
                        newQuery[key+".empleoCargoComision"]={ $regex : diacriticSensitiveRegex(value.empleoCargoComision),  $options : 'i'};    
                    }                    
                }
                if(typeof value.nivelOrdenGobierno != 'undefined'){
                    if(value.nivelOrdenGobierno !== "" ){
                        newQuery[key+".nivelOrdenGobierno"]={ $regex : diacriticSensitiveRegex(value.nivelOrdenGobierno), $options : 'i'};
                    }                    
                }
                if(typeof value.nivelEmpleoCargoComision != 'undefined'){
                    if(value.nivelEmpleoCargoComision !== "" ){
                        newQuery[key+".nivelEmpleoCargoComision"]={ $regex : diacriticSensitiveRegex(value.nivelEmpleoCargoComision),  $options : 'i'}
                    }                    
                }                                                        
            }else if(key === "bienesInmuebles"){
                    console.log("  Entré a bienes inmuebles");
                    console.log("  *********************************");
                    console.log("  value.superficieConstruccion "+value.superficieConstruccion);
                    console.log(value.superficieConstruccion);
                    console.log("  value.superficieTerreno "+value.superficieTerreno);
                    console.log(value.superficieTerreno);
                    console.log("   *********************************");

                    if( typeof value.superficieConstruccion != 'undefined' ){
                        console.log(`   valor de superficieConstruccion min ${value.superficieConstruccion.min}`);
                        console.log(`   valor de superficieConstruccion max ${value.superficieConstruccion.max}`);
                        if( typeof value.superficieConstruccion.min != 'undefined' ){
                             if (value.superficieConstruccion.min>=0){
                                newQuery[key+".bienInmueble.superficieConstruccion.valor"] = {$gte : value.superficieConstruccion.min};
                             }else
                             {
                                newQuery[key+".bienInmueble.superficieConstruccion.valor"] = {$lte : value.superficieConstruccion.min};    
                             }
                            
                        }
                        if( typeof value.superficieConstruccion.max != 'undefined' ){  
                            newQuery[key+".bienInmueble.superficieConstruccion.valor"] = {$lte : value.superficieConstruccion.max};
                        }
                        if( (typeof value.superficieConstruccion.min != 'undefined') && (typeof value.superficieConstruccion.max != 'undefined')) {
                            newQuery[key+".bienInmueble.superficieConstruccion.valor"] = {$gte : value.superficieConstruccion.min, $lte : value.superficieConstruccion.max};
                        }                        
                    } 
                    else {
                              
                    }
                    
                    if(typeof value.superficieTerreno != 'undefined'){
                        console.log(`   valor de superficieTerreno min ${value.superficieTerreno.min}`);
                        console.log(`   valor de superficieTerreno max ${value.superficieTerreno.max}`);
                        if(typeof value.superficieTerreno.min != 'undefined') {
                            if (value.superficieTerreno.min>=0){
                                newQuery[key+".bienInmueble.superficieTerreno.valor"] = {$gte : value.superficieTerreno.min};
                                vMenor=value.superficieTerreno.min;
                            }else{
                                newQuery[key+".bienInmueble.superficieTerreno.valor"] = {$lte : value.superficieTerreno.min};
                            }
                            
                        }
                        if(typeof value.superficieTerreno.max != 'undefined') {
                            newQuery[key+".bienInmueble.superficieTerreno.valor"] = {$lte : value.superficieTerreno.max};
                            vMayor=value.superficieTerreno.max;
                        }
                        if((typeof value.superficieTerreno.min != 'undefined') && (typeof value.superficieTerreno.max != 'undefined')) {
                            newQuery[key+".bienInmueble.superficieTerreno.valor"] = {$gte : value.superficieTerreno.min, $lte : value.superficieTerreno.max};
                            vMenor=value.superficieTerreno.min;
                            vMayor=value.superficieTerreno.max;
                        }                
                    } 
                    else {
                       
                    }

                    console.log(value.valorAdquisicion);
                    if(typeof value.valorAdquisicion != 'undefined'){
                        console.log(`   valor de valorAdquisicion min ${value.valorAdquisicion.min}`);
                        console.log(`   valor de valorAdquisicion max ${value.valorAdquisicion.max}`);
                        if(typeof value.valorAdquisicion.min != 'undefined') {
                            if(value.valorAdquisicion.min>=0){
                                newQuery[key+".bienInmueble.valorAdquisicion.valor"] = {$gte : value.valorAdquisicion.min};
                            }else{
                                newQuery[key+".bienInmueble.valorAdquisicion.valor"] = {$lte : value.valorAdquisicion.min};
                            }
                            
                        }
                        if(typeof value.valorAdquisicion.max != 'undefined') {
                            newQuery[key+".bienInmueble.valorAdquisicion.valor"] = {$lte : value.valorAdquisicion.max};
                        }
                        if((typeof value.valorAdquisicion.min != 'undefined') && typeof value.valorAdquisicion.max != 'undefined') {
                            newQuery[key+".bienInmueble.valorAdquisicion.valor"] = {$gte : value.valorAdquisicion.min, $lte : value.valorAdquisicion.max};
                        }                
                    } 
                    else {
                       
                    }

                    console.log(value.formaAdquisicion);
                    if(typeof value.formaAdquisicion != 'undefined'){
                        if(value.formaAdquisicion !== "" ){
                            console.log(`   valor de formaAdquisicion ${value.formaAdquisicion}`);
                            newQuery[key+".bienInmueble.formaAdquisicion.valor"] = { $regex : diacriticSensitiveRegex(value.formaAdquisicion),  $options : 'i'}
                        }                        
                    } 
                    else {
                       
                    }                    
               
            }else if(key === "totalIngresosNetos"){

                    console.log("   Entre a total Ingresos Netos ");
                    console.log("   *********************************");
                    console.log("   value.totalIngresosNetos min ");
                    console.log(value.min);
                    console.log("   value.totalIngresosNetos max ");
                    console.log(value.max);
                    console.log("   valor de value");
                    console.log(value);
                                       

                    if(typeof value.min != 'undefined') { 
                        //newQuery["ingresos.totalIngresosMensualesNetos.valor"] = {$gte : value.min};
                        newQuery["ingresos.ingresoMensualNetoDeclarante.valor"] = {$gte : value.min};
                        newQuery["ingresos.ingresoAnualNetoDeclarante.valor"] = {$gte : value.min};
                        newQuery["ingresos.ingresoConclusionNetoDeclarante.valor"] = {$gte : value.min};
                    }
                    if(typeof value.max != 'undefined') { 
                        //newQuery["ingresos.totalIngresosMensualesNetos.valor"] = {$lte : value.max};
                        newQuery["ingresos.ingresoMensualNetoDeclarante.valor"] = {$lte : value.max};
                        newQuery["ingresos.ingresoAnualNetoDeclarante.valor"] = {$lte : value.max};
                        newQuery["ingresos.ingresoConclusionNetoDeclarante.valor"] = {$lte : value.max};
                    }
                    if( (typeof value.min != 'undefined') && (typeof value.max != 'undefined') ) {
                        //newQuery["ingresos.totalIngresosMensualesNetos.valor"] = {$gte : value.min, $lte : value.max};
                        newQuery["ingresos.ingresoMensualNetoDeclarante.valor"] = {$gte : value.min, $lte : value.max};
                        newQuery["ingresos.ingresoAnualNetoDeclarante.valor"] = {$gte : value.min, $lte : value.max};
                        newQuery["ingresos.ingresoConclusionNetoDeclarante.valor"] = {$gte : value.min, $lte : value.max};
                    }                
            }else{
                console.log("   Entre en el else final del newQuery");
                console.log(newQuery[key]= value);
                newQuery[key]= value
            }
        }
        console.log("---------------------------------");
        console.log("Valor 'query' final");
        console.log(query);
        console.log("Valor 'sortObj' final");
        console.log(sortObj);
        console.log("Valor 'newQuery' final");
        console.log(newQuery);
        console.log("Valor 'newSort' final");
        console.log(newSort);        

        if(pageSize<1){pageSize=10; }
        if(pageSize>200){pageSize=200;}
        let projection = require('./projection.json');
        //if(pageSize >= 1 && pageSize <= 200 ){            
            let paginationResult = await Declaracion.paginate(newQuery,{projection: projection, page: page , limit: pageSize, sort: newSort, collation:{locale:'es'}}).then();
            let objpagination = {hasNextPage : false, pageSize : paginationResult.limit, page:paginationResult.page, totalRows: paginationResult.totalDocs }
            //hasNextPage:paginationResult.hasNextPage ** Se desconoce el porqué se debe enviar siempre "False".
            let newobjresults = paginationResult.docs;

            //REVISAR ESTE PROCESO
            //Aqui es en donde se reordena cada OBJETO de la información

            try {
                var strippedRows = _.map(newobjresults, function (row) {
                    let rowExtend=  _.extend({id: row._id} , row.toObject());
                    return _.omit(rowExtend, '_id');
                });
            }catch (e) {
                console.log(e);
            }

            //console.log(strippedRows);

            //****************************************************** 
            //Ciclo para recorrer todo el arreglo de repuestas de la API para
            //poder agregarle los elementos que le hacen falta y que
            //se encuentran establecidos en el OPENAPI
            
            let newstrippedRows = [];
            let nlongitud = 0;
            let fechaConvertida = "";
            let existeFecha = null;
            let existeValor = null;

            let totalIngresosDeclarante = 0;
            let totalIngresosPareja = 0;
            let sumatotalIngresosAnualesNetos = 0;
            let resultado = "";
                        
            console.log("Longitud de 'strippedRows' - OBJETOS");
            console.log(strippedRows.length);

            
            let cuantosLlevo = 0
            for (let elemento of strippedRows) {                                                                            
                
                    cuantosLlevo = cuantosLlevo + 1;                    
                    //console.log(cuantosLlevo);
                    //console.log("inicié o regresé al ciclo principal");
                    
                    //console.log(" ");
                    //console.log(`Objeto: (${cuantosLlevo})`);
                    //console.log("---------------------------------");
                    
                    //**************************************************************//
                    // Corrección de valores almacenados en la DB del S1 de captura //

                    // Metadata
                    //console.log("   METADATA");
                    if ( elemento.tipoDeclaracion === "MODIFICACION" ) {
                        elemento.tipoDeclaracion = "MODIFICACIÓN";
                    }
                    if (elemento.tipoDeclaracion === "CONCLUSION") {
                        elemento.tipoDeclaracion = "CONCLUSIÓN";
                    }

                    //situacionPatrimonial
                    
                    // 1. Datos generales
                    //console.log("   1. DATOS GENERALES");
                    existeValor = getProp(elemento,'datosGenerales.correoElectronico.institucional');
                    //console.log(existeValor);
                    if (typeof existeValor != 'undefined' ) {                        
                        if (elemento.datosGenerales.correoElectronico.institucional === null) {
                            elemento.datosGenerales.correoElectronico.institucional = " ";
                        }
                    }   
                    
                    existeValor = getProp(elemento,'datosGenerales.nacionalidad');
                    if (existeValor != null ) {                        
                        if (elemento.datosGenerales.nacionalidad != null) {
                            resultado = paisNacionalidad.buscaNacionalidad(elemento.datosGenerales.nacionalidad);
                            elemento.datosGenerales.nacionalidad = resultado;
                        }else {
                            elemento.datosGenerales.nacionalidad = "---";
                        }

                    }

                    // ***
                    existeValor = getProp(elemento,'datosGenerales');
                    if (existeValor != null ) {                        
                        if (elemento.datosGenerales.segundoApellido === null) {
                            elemento.datosGenerales.segundoApellido = "";
                        }
                    }else{
                        elemento.datosGenerales = {
                            "nombre": "",
                            "primerApellido": "",
                            "segundoApellido":""
                        };
                    }
                    existeValor = getProp(elemento,'datosGenerales.situacionPersonalEstadoCivil');
                    if (existeValor != null ) {                         
                        existeValor = getProp(elemento,'datosGenerales.situacionPersonalEstadoCivil.clave');
                        if (existeValor != null ) {                            
                            if (elemento.datosGenerales.situacionPersonalEstadoCivil.clave === "CON") {
                                existeValor = getProp(elemento,'datosGenerales.situacionPersonalEstadoCivil.valor');                                
                                if (existeValor != null ) {                                    
                                    elemento.datosGenerales.situacionPersonalEstadoCivil.valor = "CONCUBINA/CONCUBINARIO/UNIÓN LIBRE"; //SE CORRIGE EL ACENTO DE LA O
                                }
                            }
                        }
                    }

                    // 2.- Domicilio del declarante ***                    
                    //console.log("   2. DOMOCILIO DECLARANTE **");
                    existeValor = getProp(elemento,'domicilioDeclarante.domicilioMexico');                                
                    if (existeValor != null ) {                        
                        if (elemento.domicilioDeclarante.domicilioMexico.numeroInterior === null) {
                            elemento.domicilioDeclarante.domicilioMexico.numeroInterior = "";
                        }
                    }

                    existeValor = getProp(elemento,'domicilioDeclarante.domicilioExtranjero');
                    if (existeValor != null ) {                        
                        if (elemento.domicilioDeclarante.domicilioExtranjero.numeroInterior === null) {
                            elemento.domicilioDeclarante.domicilioExtranjero.numeroInterior = "";
                        }
                    }
                    // 3.- Datos curriculares del declarante 
                    //console.log("   3. ESCOLARIDAD");
                    existeValor = getProp(elemento,'datosCurricularesDeclarante');
                    //console.log(existeValor);
                    if (typeof existeValor === 'undefined' ) {
                        elemento.datosCurricularesDeclarante={'escolaridad':[]};
                    }

                    existeValor = getProp(elemento,'datosCurricularesDeclarante.escolaridad');
                    if (existeValor != null ) {

                        nlongitud = elemento.datosCurricularesDeclarante.escolaridad.length;
                        //console.log(`      length: (${nlongitud})`);
                        if (nlongitud > 0) {

                            for (var i = 0; i < nlongitud; i++) {

                                if( elemento.datosCurricularesDeclarante.escolaridad[i].fechaObtencion != null ) {
                                    fechaConvertida = elemento.datosCurricularesDeclarante.escolaridad[i].fechaObtencion.toISOString().substring(0,10);
                                    elemento.datosCurricularesDeclarante.escolaridad[i].fechaObtencion = fechaConvertida;
                                }                            
                                // ***
                                if( elemento.datosCurricularesDeclarante.escolaridad[i].carreraAreaConocimiento === null ) {                                    
                                    elemento.datosCurricularesDeclarante.escolaridad[i].carreraAreaConocimiento = "";
                                }
                            }

                        }

                    }

                    // 4.- Datos del empleo, cargo o comisión que inicia ***
                    //console.log("   4. DATOS DEL EMPLEO, CARGO O COMISIÓN");
                    existeValor = getProp(elemento,'datosEmpleoCargoComision');
                    if(typeof existeValor == 'undefined'){                        
                        elemento=Object.assign(elemento, {"datosEmpleoCargoComision":{"domicilioMexico":{"municipioAlcaldia":{"clave":"000"},"entidadFederativa":{"clave":"00"}},"nivelOrdenGobierno":"MUNICIPAL_ALCALDIA","nombreEntePublico":"","empleoCargoComision":"","nivelEmpleoCargoComision": ""}});                        
                    }
                    
                    existeValor = getProp(elemento,'datosEmpleoCargoComision.domicilioMexico');
                    if(typeof existeValor == 'undefined'){
                        elemento.datosEmpleoCargoComision=Object.assign(elemento.datosEmpleoCargoComision, {"domicilioMexico":{"municipioAlcaldia":{"clave":"000"},"entidadFederativa":{"clave":"00"}}});                        
                    }                    
                    
                    existeValor = getProp(elemento,'datosEmpleoCargoComision.domicilioMexico');
                    if (existeValor != null ) {                        
                        if (elemento.datosEmpleoCargoComision.domicilioMexico.numeroInterior === null) {
                            elemento.datosEmpleoCargoComision.domicilioMexico.numeroInterior = "";                        
                        }
                    }
                    existeValor = getProp(elemento,'datosEmpleoCargoComision.domicilioExtranjero');
                    if (existeValor != null ) {                        
                        if (elemento.datosEmpleoCargoComision.domicilioExtranjero.numeroInterior === null) {
                            elemento.datosEmpleoCargoComision.domicilioExtranjero.numeroInterior = "";                        
                        }
                    }
                    existeValor = getProp(elemento,'datosEmpleoCargoComision.telefonoOficina');
                    if (existeValor != null ) {                        
                        if (elemento.datosEmpleoCargoComision.telefonoOficina.telefono === null) {
                            elemento.datosEmpleoCargoComision.telefonoOficina.telefono = "";                        
                        }
                        if (elemento.datosEmpleoCargoComision.telefonoOficina.extension === null) {
                            elemento.datosEmpleoCargoComision.telefonoOficina.extension = "";                        
                        }
                    }
                                    
                    existeValor = getProp(elemento,'datosEmpleoCargoComision.otroEmpleoCargoComision');
                    if (existeValor != null ) {                                                                        
                        existeValor = getProp(elemento,'datosEmpleoCargoComision.otroEmpleoCargoComision.telefonoOficina');
                        if (existeValor != null ) {
                            if (elemento.datosEmpleoCargoComision.otroEmpleoCargoComision.telefonoOficina.telefono === null) {
                                elemento.datosEmpleoCargoComision.otroEmpleoCargoComision.telefonoOficina.telefono = "";                        
                            }
                            if (elemento.datosEmpleoCargoComision.otroEmpleoCargoComision.telefonoOficina.extension === null) {
                                elemento.datosEmpleoCargoComision.otroEmpleoCargoComision.telefonoOficina.extension = "";                        
                            }
                        }
                        existeValor = getProp(elemento,'datosEmpleoCargoComision.otroEmpleoCargoComision.domicilioMexico');
                        if (existeValor != null ) {                        
                            if (elemento.datosEmpleoCargoComision.otroEmpleoCargoComision.domicilioMexico.calle === null) {                            
                                elemento.datosEmpleoCargoComision.otroEmpleoCargoComision.domicilioMexico.calle = "";                            
                            }
                            if (elemento.datosEmpleoCargoComision.otroEmpleoCargoComision.domicilioMexico.numeroExterior === null) {                            
                                elemento.datosEmpleoCargoComision.otroEmpleoCargoComision.domicilioMexico.numeroExterior = "";                            
                            }                        
                            if (elemento.datosEmpleoCargoComision.otroEmpleoCargoComision.domicilioMexico.numeroInterior === null) {                            
                                elemento.datosEmpleoCargoComision.otroEmpleoCargoComision.domicilioMexico.numeroInterior = "";                            
                            }                        
                            if (elemento.datosEmpleoCargoComision.otroEmpleoCargoComision.domicilioMexico.coloniaLocalidad === null) {                            
                                elemento.datosEmpleoCargoComision.otroEmpleoCargoComision.domicilioMexico.coloniaLocalidad = "";                            
                            }                        
                            if (elemento.datosEmpleoCargoComision.otroEmpleoCargoComision.domicilioMexico.entidadFederativa === null) {                            
                                elemento.datosEmpleoCargoComision.otroEmpleoCargoComision.domicilioMexico.entidadFederativa = {"clave":"00"};                            
                            }                        
                            if (elemento.datosEmpleoCargoComision.otroEmpleoCargoComision.domicilioMexico.codigoPostal === null) {                            
                                elemento.datosEmpleoCargoComision.otroEmpleoCargoComision.domicilioMexico.codigoPostal = "";                            
                            }                        
                        }
                        existeValor = getProp(elemento,'datosEmpleoCargoComision.otroEmpleoCargoComision.domicilioExtranjero');
                        if (existeValor != null ) {                        
                            if (elemento.datosEmpleoCargoComision.otroEmpleoCargoComision.domicilioExtranjero.numeroInterior === null) {
                                elemento.datosEmpleoCargoComision.otroEmpleoCargoComision.domicilioExtranjero.numeroInterior = "";                            
                            }
                        }                            
                        if (Array.isArray(elemento.datosEmpleoCargoComision.otroEmpleoCargoComision)==false){
                            elemento.datosEmpleoCargoComision.otroEmpleoCargoComision=[elemento.datosEmpleoCargoComision.otroEmpleoCargoComision];
                        }
                    }                    
                    

                    // 5.- Experiencia laboral (últimos cinco empleos)
                    //console.log("   5. EXPERIENCIA LABORAL");
                    existeValor = getProp(elemento,'experienciaLaboral');
                    if(typeof existeValor == 'undefined'){                        
                        elemento=Object.assign(elemento, {"experienciaLaboral":{"ninguno":true,"experiencia":[]}});                        
                    }

                    existeValor = getProp(elemento,'experienciaLaboral.experiencia');
                    if (existeValor != null ) {

                        nlongitud = elemento.experienciaLaboral.experiencia.length;
                        //console.log(`      length: (${nlongitud})`);
                        if (nlongitud > 0) {
                            elemento.experienciaLaboral.ninguno=false;
                        }else{
                            elemento.experienciaLaboral.ninguno=true;
                        }
                    

                        if (nlongitud > 0) {

                            for (var i = 0; i < nlongitud; i++) {

                                if( elemento.experienciaLaboral.experiencia[i].nombreEmpresaSociedadAsociacion === null ) {
                                    elemento.experienciaLaboral.experiencia[i].nombreEmpresaSociedadAsociacion = " ";
                                }
                                if( elemento.experienciaLaboral.experiencia[i].rfc === null ) {
                                    elemento.experienciaLaboral.experiencia[i].rfc = " ";
                                }
                                if( elemento.experienciaLaboral.experiencia[i].area === null ) {
                                    elemento.experienciaLaboral.experiencia[i].area = " ";
                                }
                                if( elemento.experienciaLaboral.experiencia[i].puesto === null ) {
                                    elemento.experienciaLaboral.experiencia[i].puesto = " ";
                                }
                                if( elemento.experienciaLaboral.experiencia[i].sector === null ) {
                                    elemento.experienciaLaboral.experiencia[i].sector = " ";
                                }
                                if( elemento.experienciaLaboral.experiencia[i].fechaIngreso != null ) {
                                    fechaConvertida = elemento.experienciaLaboral.experiencia[i].fechaIngreso.toISOString().substring(0,10);
                                    elemento.experienciaLaboral.experiencia[i].fechaIngreso = fechaConvertida;
                                }
                            }

                        }

                    }
                    //6.- Datos pareja **Este código bloquea el proceso
                    //console.log("   6. DATOS PAREJA - FECHA INGRESO");
                    existeFecha = getProp(elemento,'datosPareja.actividadLaboralSectorPublico.fechaIngreso');
                    if (existeFecha != null ) {
                        
                        fechaConvertida = elemento.datosPareja.actividadLaboralSectorPublico.fechaIngreso.toISOString().substring(0,10);
                        elemento.datosPareja.actividadLaboralSectorPublico.fechaIngreso = fechaConvertida;
                    
                    }

                    existeFecha = getProp(elemento,'datosPareja.actividadLaboralSectorPrivadoOtro.fechaIngreso');
                    if (existeFecha != null ) {
                        
                        fechaConvertida = elemento.datosPareja.actividadLaboralSectorPrivadoOtro.fechaIngreso.toISOString().substring(0,10);
                        elemento.datosPareja.actividadLaboralSectorPrivadoOtro.fechaIngreso = fechaConvertida;
                    
                    }
                    // ****
                    existeValor = getProp(elemento,'datosPareja');
                    if (existeValor != null ) {
                        if (elemento.datosPareja.rfc === null) {
                            elemento.datosPareja.rfc = "";                        
                        }
                        if (elemento.datosPareja.curp === null) {
                            elemento.datosPareja.curp = "";                        
                        }
                        if (elemento.datosPareja.segundoApellido === null) {
                            elemento.datosPareja.segundoApellido = "";                        
                        }
                    }
                    existeValor = getProp(elemento,'datosPareja.actividadLaboral');
                    if (existeValor != null ) {
                        existeValor = getProp(elemento,'datosPareja.actividadLaboral.clave');
                        if (existeValor != null ) {
                            if (elemento.datosPareja.actividadLaboral.clave === "OTR") {
                                elemento.datosPareja.actividadLaboral.clave = "OTRO"; //REEMPLAZO DE CLAVE TEMPORAL, DE OTR A OTRO.
                            }
                        }
                    }
                    existeValor = getProp(elemento,'datosPareja.domicilioMexico');
                    if (existeValor != null ) {                        
                        if (elemento.datosPareja.domicilioMexico.numeroInterior === null) {                            
                            elemento.datosPareja.domicilioMexico.numeroInterior = "";                            
                        }                        
                    }
                    existeValor = getProp(elemento,'datosPareja.domicilioExtranjero');
                    if (existeValor != null ) {                        
                        if (elemento.datosPareja.domicilioExtranjero.numeroInterior === null) {
                            elemento.datosPareja.domicilioExtranjero.numeroInterior = "";                            
                        }
                    }  
                    existeValor = getProp(elemento,'datosPareja.actividadLaboralSectorPrivadoOtro');
                    if (existeValor != null ) {                        
                        if (elemento.datosPareja.actividadLaboralSectorPrivadoOtro.rfc === null) {
                            elemento.datosPareja.actividadLaboralSectorPrivadoOtro.rfc = "";                            
                        }
                    }  
                    
                    // 7.- Datos del dependiente económico ***
                    //console.log("   7. Datos del dependiente económico");
                    existeValor = getProp(elemento,'datosDependientesEconomicos.dependienteEconomico');
                    if (existeValor != null ) {

                        nlongitud = elemento.datosDependientesEconomicos.dependienteEconomico.length;
                        //console.log(`      length: (${nlongitud})`);
                        if (nlongitud > 0) {

                            for (var i = 0; i < nlongitud; i++) {

                                if( elemento.datosDependientesEconomicos.dependienteEconomico[i].segundoApellido === null ) {                                    
                                    elemento.datosDependientesEconomicos.dependienteEconomico[i].segundoApellido = "";
                                }                                                            
                                if( elemento.datosDependientesEconomicos.dependienteEconomico[i].curp === null ) {                                    
                                    elemento.datosDependientesEconomicos.dependienteEconomico[i].curp = "";
                                }
                                existeValor = getProp(elemento.datosDependientesEconomicos.dependienteEconomico[i],'domicilioMexico');
                                if (existeValor != null ) {
                                    if (elemento.datosDependientesEconomicos.dependienteEconomico[i].domicilioMexico.numeroInterior === null) {
                                        elemento.datosDependientesEconomicos.dependienteEconomico[i].domicilioMexico.numeroInterior = "";                        
                                    }
                                }                                
                                existeValor = getProp(elemento.datosDependientesEconomicos.dependienteEconomico[i],'domicilioExtranjero');
                                if (existeValor != null ) {
                                    if (elemento.datosDependientesEconomicos.dependienteEconomico[i].domicilioExtranjero.numeroInterior === null) {
                                        elemento.datosDependientesEconomicos.dependienteEconomico[i].domicilioExtranjero.numeroInterior = "";                        
                                    }
                                }

                                if (elemento.datosDependientesEconomicos.dependienteEconomico[i].lugarDondeReside === null) {
                                    elemento.datosDependientesEconomicos.dependienteEconomico[i].lugarDondeReside = "";                        
                                }
                                if (elemento.datosDependientesEconomicos.dependienteEconomico[i].domicilioMexico === null) {
                                    elemento.datosDependientesEconomicos.dependienteEconomico[i].domicilioMexico = {};                        
                                }
                                if (elemento.datosDependientesEconomicos.dependienteEconomico[i].domicilioExtranjero === null) {
                                    elemento.datosDependientesEconomicos.dependienteEconomico[i].domicilioExtranjero = {};                        
                                }

                                if (elemento.datosDependientesEconomicos.dependienteEconomico[i].actividadLaboralSectorPublico === null) {
                                    elemento.datosDependientesEconomicos.dependienteEconomico[i].actividadLaboralSectorPublico = {};                        
                                }
                                existeValor = getProp(elemento.datosDependientesEconomicos.dependienteEconomico[i],'actividadLaboralSectorPublico');
                                if (existeValor != null ) {
                                    if (elemento.datosDependientesEconomicos.dependienteEconomico[i].actividadLaboralSectorPublico.rfc === null) {
                                        elemento.datosDependientesEconomicos.dependienteEconomico[i].actividadLaboralSectorPublico.rfc = "";                        
                                    }
                                }

                                if (elemento.datosDependientesEconomicos.dependienteEconomico[i].actividadLaboralSectorPrivadoOtro === null) {
                                    elemento.datosDependientesEconomicos.dependienteEconomico[i].actividadLaboralSectorPrivadoOtro = {};
                                }
                                existeValor = getProp(elemento.datosDependientesEconomicos.dependienteEconomico[i],'actividadLaboralSectorPrivadoOtro');
                                if (existeValor != null ) {
                                    if (elemento.datosDependientesEconomicos.dependienteEconomico[i].actividadLaboralSectorPrivadoOtro.rfc === null) {
                                        elemento.datosDependientesEconomicos.dependienteEconomico[i].actividadLaboralSectorPrivadoOtro.rfc = "";                        
                                    }
                                }
                                
                            }

                        }

                    }

                    // 8.- Ingresos netos del declarante, pareja y/o dependendientes económicos
                    //console.log("   8. INGRESOS");
                    existeValor = getProp(elemento,'ingresos');
                    if (existeValor != null ) {                        
                        if ( elemento.tipoDeclaracion === "INICIAL" ) {
                            //elemento.ingresos.ingresoAnualNetoDeclarante = elemento.ingresos.ingresoMensualNetoDeclarante;
                            //elemento.ingresos.ingresoConclusionNetoDeclarante = elemento.ingresos.ingresoMensualNetoDeclarante;
                        }
                        if ( elemento.tipoDeclaracion === "MODIFICACIÓN" ) {

                            //Remuneración neta del declarante por su cargo público (por Concepto de sueldos,
                            //honorarios, compensaciones, bonos y otras Prestaciones) (cantidades netas después de impuestos)
                            elemento.ingresos.remuneracionAnualCargoPublico = elemento.ingresos.remuneracionMensualCargoPublico;
                            elemento.ingresos.otrosIngresosAnualesTotal = elemento.ingresos.otrosIngresosMensualesTotal;
                            //Ingreso neto del declarante (suma del numeral I y II).
                            elemento.ingresos.ingresoAnualNetoDeclarante = elemento.ingresos.ingresoMensualNetoDeclarante;
                            elemento.ingresos.ingresoAnualNetoParejaDependiente = elemento.ingresos.ingresoMensualNetoParejaDependiente;
                            //elemento.ingresos.ingresoConclusionNetoDeclarante = elemento.ingresos.ingresoMensualNetoDeclarante;
                            //Total de ingresos netos percibidos por el declarante, pareja y/o dependientes 
                            //económicos (suma de Ingreso neto del declarante (suma del numeral I y II) +
                            // Ingreso neto de la pareja y/o dependientes económicos (después de impuestos))
                            totalIngresosDeclarante = elemento.ingresos.ingresoMensualNetoDeclarante.valor;
                            totalIngresosPareja = elemento.ingresos.ingresoMensualNetoParejaDependiente.valor;
                            sumatotalIngresosAnualesNetos = totalIngresosDeclarante + totalIngresosPareja;
                            elemento.ingresos.totalIngresosAnualesNetos = {
                                valor : sumatotalIngresosAnualesNetos,
                                moneda : "MXN"
                            }

                        }
                        if (elemento.tipoDeclaracion === "CONCLUSIÓN") {
                        
                            //Remuneración neta del declarante por su cargo público (por Concepto de sueldos,
                            //honorarios, compensaciones, bonos y otras Prestaciones) (cantidades netas después de impuestos)
                            elemento.ingresos.remuneracionConclusionCargoPublico = elemento.ingresos.remuneracionMensualCargoPublico;                            
                            elemento.ingresos.otrosIngresosConclusionTotal = elemento.ingresos.otrosIngresosMensualesTotal;
                            //Ingreso neto del declarante (suma del numeral I y II).
                            //elemento.ingresos.ingresoAnualNetoDeclarante = elemento.ingresos.ingresoMensualNetoDeclarante;
                            elemento.ingresos.ingresoConclusionNetoDeclarante = elemento.ingresos.ingresoMensualNetoDeclarante;
                            elemento.ingresos.ingresoConclusionNetoParejaDependiente = elemento.ingresos.ingresoMensualNetoParejaDependiente;
                            //Total de ingresos netos percibidos por el declarante, pareja y/o dependientes 
                            //económicos (suma de Ingreso neto del declarante (suma del numeral I y II) +
                            // Ingreso neto de la pareja y/o dependientes económicos (después de impuestos))
                            totalIngresosDeclarante = elemento.ingresos.ingresoMensualNetoDeclarante.valor;
                            totalIngresosPareja = elemento.ingresos.ingresoMensualNetoParejaDependiente.valor;
                            sumatotalIngresosAnualesNetos = totalIngresosDeclarante + totalIngresosPareja;
                            elemento.ingresos.totalIngresosConclusionNetos = {
                                valor : sumatotalIngresosAnualesNetos,
                                moneda : "MXN"
                            } 
                        }

                    }else{
                        if ( elemento.tipoDeclaracion === "INICIAL" ) {
                            elemento.ingresos = {   'remuneracionMensualCargoPublico':{"valor": 0,"moneda": "MXN"},
                                                    'otrosIngresosMensualesTotal':{"valor": 0,"moneda": "MXN"},
                                                    'actividadIndustrialComercialEmpresarial':{"remuneracionTotal": {"valor": 0,"moneda": "MXN"},"actividades": []},
                                                    'actividadFinanciera':{"remuneracionTotal": {"valor": 0,"moneda": "MXN"},"actividades": []},
                                                    'serviciosProfesionales':{"remuneracionTotal": {"valor": 0,"moneda": "MXN"},"servicios": []},
                                                    'otrosIngresos':{"remuneracionTotal": {"valor": 0,"moneda": "MXN"},"ingresos": []},
                                                    'ingresoMensualNetoDeclarante':{"valor":0,"moneda": "MXN"},
                                                    'ingresoMensualNetoParejaDependiente':{"valor":0,"moneda": "MXN"},
                                                    'totalIngresosMensualesNetos':{"valor":0,"moneda": "MXN"},
                                                    'aclaracionesObservaciones':""
                                            };
                        }
                        if ( elemento.tipoDeclaracion === "MODIFICACIÓN" ) {
                            elemento.ingresos = {   'remuneracionAnualCargoPublico':{"valor": 0,"moneda": "MXN"},
                                                    'otrosIngresosAnualesTotal':{"valor": 0,"moneda": "MXN"},
                                                    'actividadIndustrialComercialEmpresarial':{"remuneracionTotal": {"valor": 0,"moneda": "MXN"},"actividades": []},
                                                    'actividadFinanciera':{"remuneracionTotal": {"valor": 0,"moneda": "MXN"},"actividades": []},
                                                    'serviciosProfesionales':{"remuneracionTotal": {"valor": 0,"moneda": "MXN"},"servicios": []},
                                                    'enajenacionBienes':{"remuneracionTotal": {"valor": 0,"moneda": "MXN"},"bienes": []},
                                                    'otrosIngresos':{"remuneracionTotal": {"valor": 0,"moneda": "MXN"},"ingresos": []},
                                                    'ingresoAnualNetoDeclarante':{"valor":0,"moneda": "MXN"},
                                                    'ingresoAnualNetoParejaDependiente':{"valor":0,"moneda": "MXN"},
                                                    'totalIngresosAnualesNetos':{"valor":0,"moneda": "MXN"},
                                                    'aclaracionesObservaciones':""                                                    
                                            };
                        }
                        if (elemento.tipoDeclaracion === "CONCLUSIÓN") {
                            elemento.ingresos = {   'remuneracionConclusionCargoPublico':{ "valor": 0,"moneda": "MXN"},
                                                    'otrosIngresosConclusionTotal':{"valor": 0,"moneda": "MXN"},
                                                    'actividadIndustrialComercialEmpresarial':{"remuneracionTotal": {"valor": 0,"moneda": "MXN"},"actividades": []},
                                                    'actividadFinanciera':{"remuneracionTotal": {"valor": 0,"moneda": "MXN"},"actividades": []},
                                                    'serviciosProfesionales':{"remuneracionTotal": {"valor": 0,"moneda": "MXN"},"servicios": []},
                                                    'enajenacionBienes':{"remuneracionTotal": {"valor": 0,"moneda": "MXN"},"bienes": []},
                                                    'otrosIngresos':{"remuneracionTotal": {"valor": 0,"moneda": "MXN"},"ingresos": []},
                                                    'ingresoConclusionNetoDeclarante':{"valor":0,"moneda": "MXN"},
                                                    'ingresoConclusionNetoParejaDependiente':{"valor":0,"moneda": "MXN"},
                                                    'totalIngresosConclusionNetos':{"valor":0,"moneda": "MXN"},
                                                    'aclaracionesObservaciones':""
                                            };
                        }                        
                    }

                    // 9.- Te desempeñaste como servidor público en el año inmediato anterior?
                    
                    //TIPO DE DECLARACIÓN CONCLUSIÓN
                    //console.log("   9. ACTIVIDAD ANUAL ANTERIOR");
                    
                    existeValor = getProp(elemento,'actividadAnualAnterior');
                    //console.log(existeValor);
                    if (typeof existeValor === 'undefined' ) {
                        elemento.actividadAnualAnterior={'servidorPublicoAnioAnterior':false};
                    }

                    existeFecha = getProp(elemento,'actividadAnualAnterior.fechaIngreso');
                    if (existeFecha != null ) {
                        
                        fechaConvertida = elemento.actividadAnualAnterior.fechaIngreso.toISOString().substring(0,10);
                        elemento.actividadAnualAnterior.fechaIngreso = fechaConvertida;

                    }

                    existeFecha = getProp(elemento,'actividadAnualAnterior.fechaConclusion');
                    if (existeFecha != null ) {
                        
                        fechaConvertida = elemento.actividadAnualAnterior.fechaConclusion.toISOString().substring(0,10);
                        elemento.actividadAnualAnterior.fechaConclusion = fechaConvertida;
            
                    }

                    //10.- Bienes inmuebles(Situación actual)
                    //console.log("   10. BIENES INMUEBLES");
                    existeValor = getProp(elemento,'bienesInmuebles.bienInmueble');
                    if (existeValor != null ) {

                        nlongitud = elemento.bienesInmuebles.bienInmueble.length;                        
                        //console.log(`      length: (${nlongitud})`);
                        if (nlongitud > 0) {
                            //console.log("   Entre a bienes inmuebles");

                            for (var i = 0; i < nlongitud; i++) {
                                //console.log("   Entre al for de bienes inmuebles");

                                if( elemento.bienesInmuebles.bienInmueble[i].superficieTerreno.valor === null ) {
                                    elemento.bienesInmuebles.bienInmueble[i].superficieTerreno.valor = 0;
                                }
                                if( elemento.bienesInmuebles.bienInmueble[i].superficieTerreno.valor % 1 != 0 ) {
                                    elemento.bienesInmuebles.bienInmueble[i].superficieTerreno.valor = parseInt(elemento.bienesInmuebles.bienInmueble[i].superficieTerreno.valor);
                                }

                                if (vMenor != null){vMenor = parseInt(vMenor);}
                                if (vMayor != null){vMayor = parseInt(vMayor);}
                                if (vMenor != null && vMayor == null){
                                    if( elemento.bienesInmuebles.bienInmueble[i].superficieTerreno.valor < vMenor) {		
                                        delete elemento.bienesInmuebles.bienInmueble[i];
                                        continue;
                                    }
                                }
                                if (vMenor == null && vMayor != null){
                                    if( elemento.bienesInmuebles.bienInmueble[i].superficieTerreno.valor > vMayor) {		
                                        delete elemento.bienesInmuebles.bienInmueble[i];
                                        continue;
                                    }
                                }
                                if (vMenor != null && vMayor != null){
                                    if( elemento.bienesInmuebles.bienInmueble[i].superficieTerreno.valor < vMenor || 
                                        elemento.bienesInmuebles.bienInmueble[i].superficieTerreno.valor > vMayor) {		
                                        delete elemento.bienesInmuebles.bienInmueble[i];
                                        continue;
                                    }
                                }
                                
                                if( elemento.bienesInmuebles.bienInmueble[i].superficieTerreno.unidad === null ) {
                                    elemento.bienesInmuebles.bienInmueble[i].superficieTerreno.unidad = "m2";
                                }
                                if( elemento.bienesInmuebles.bienInmueble[i].superficieConstruccion.valor === null ) {
                                    elemento.bienesInmuebles.bienInmueble[i].superficieConstruccion.valor = 0;
                                }
                                if( elemento.bienesInmuebles.bienInmueble[i].superficieConstruccion.valor % 1 != 0 ) {
                                    elemento.bienesInmuebles.bienInmueble[i].superficieConstruccion.valor = parseInt(elemento.bienesInmuebles.bienInmueble[i].superficieConstruccion.valor);
                                }
                                if( elemento.bienesInmuebles.bienInmueble[i].superficieConstruccion.unidad === null ) {
                                    elemento.bienesInmuebles.bienInmueble[i].superficieConstruccion.unidad = "m2";
                                }
                                if( elemento.bienesInmuebles.bienInmueble[i].formaPago === "CREDITO" ) {
                                    elemento.bienesInmuebles.bienInmueble[i].formaPago = "CRÉDITO";
                                }
                                if( elemento.bienesInmuebles.bienInmueble[i].formaPago === "NO_APLICA" ) {
                                    elemento.bienesInmuebles.bienInmueble[i].formaPago = "NO APLICA";
                                }
                                if( elemento.bienesInmuebles.bienInmueble[i].valorConformeA === "ESCRITURA_PUBLICA" ) {
                                    elemento.bienesInmuebles.bienInmueble[i].valorConformeA = "ESCRITURA PÚBLICA";
                                }
                                if( elemento.bienesInmuebles.bienInmueble[i].domicilioExtranjero === null ) {
                                    elemento.bienesInmuebles.bienInmueble[i].domicilioExtranjero = {};
                                }
                                if( elemento.bienesInmuebles.bienInmueble[i].motivoBaja === null ) {
                                    elemento.bienesInmuebles.bienInmueble[i].motivoBaja = {};
                                }
                                if( elemento.bienesInmuebles.bienInmueble[i].fechaAdquisicion != null ) {
                                    fechaConvertida = elemento.bienesInmuebles.bienInmueble[i].fechaAdquisicion.toISOString().substring(0,10);
                                    elemento.bienesInmuebles.bienInmueble[i].fechaAdquisicion = fechaConvertida;
                                }
                                // ***                                                                
                                if( elemento.bienesInmuebles.bienInmueble[i].tercero[0].nombreRazonSocial === null ) {
                                    elemento.bienesInmuebles.bienInmueble[i].tercero[0].nombreRazonSocial = "";
                                }
                                if( elemento.bienesInmuebles.bienInmueble[i].tercero[0].rfc === null ) {
                                    elemento.bienesInmuebles.bienInmueble[i].tercero[0].rfc = "";
                                }
                                if( elemento.bienesInmuebles.bienInmueble[i].tercero[0].tipoPersona === null ||
                                     elemento.bienesInmuebles.bienInmueble[i].tercero[0].tipoPersona === "") {
                                    if ( elemento.bienesInmuebles.bienInmueble[i].tercero[0].rfc != "") {
                                        if(elemento.bienesInmuebles.bienInmueble[i].tercero[0].rfc.length > 12){
                                            elemento.bienesInmuebles.bienInmueble[i].tercero[0].tipoPersona = "FISICA";
                                        }
                                        if(elemento.bienesInmuebles.bienInmueble[i].tercero[0].rfc.length == 12){
                                            elemento.bienesInmuebles.bienInmueble[i].tercero[0].tipoPersona = "MORAL";
                                        }
                                    }else{
                                        elemento.bienesInmuebles.bienInmueble[i].tercero[0].tipoPersona = "";
                                    }
                                }
                                if( elemento.bienesInmuebles.bienInmueble[i].tercero[0].nombreRazonSocial==="" && 
                                    elemento.bienesInmuebles.bienInmueble[i].tercero[0].rfc === "" && 
                                    (   elemento.bienesInmuebles.bienInmueble[i].tercero[0].tipoPersona === null || 
                                        elemento.bienesInmuebles.bienInmueble[i].tercero[0].tipoPersona === "") 
                                    ){
                                    delete elemento.bienesInmuebles.bienInmueble[i].tercero;
                                }
                                if( elemento.bienesInmuebles.bienInmueble[i].domicilioMexico != null ) {
                                    if (elemento.bienesInmuebles.bienInmueble[i].domicilioMexico.numeroInterior  === null) {
                                        elemento.bienesInmuebles.bienInmueble[i].domicilioMexico.numeroInterior = "";                        
                                    }
                                }
                                if( elemento.bienesInmuebles.bienInmueble[i].domicilioExtranjero != null ) {
                                    if (elemento.bienesInmuebles.bienInmueble[i].domicilioExtranjero.numeroInterior  === null) {
                                        elemento.bienesInmuebles.bienInmueble[i].domicilioExtranjero.numeroInterior = "";                        
                                    }
                                }                                                                

                            }
                            let arrayTemp=elemento.bienesInmuebles.bienInmueble.filter((item) => item !== null);
                            delete elemento.bienesInmuebles.bienInmueble;
                            elemento.bienesInmuebles.bienInmueble=arrayTemp;
                        }

                    }                    

                    //11.- Vehículos
                    //console.log("   11. VEHÍCULOS");
                    existeValor = getProp(elemento,'vehiculos.vehiculo');
                    if (existeValor != null ) {

                        nlongitud = elemento.vehiculos.vehiculo.length;
                        //console.log(`      length: (${nlongitud})`);
                        if (nlongitud > 0) {

                            //console.log("   Entre a vehículos");
                            for (var i = 0; i < nlongitud; i++) {
                                //console.log("   Entre al FOR a vehículos");
                                if( elemento.vehiculos.vehiculo[i].lugarRegistro.pais === null ) {
                                    elemento.vehiculos.vehiculo[i].lugarRegistro.pais = " ";
                                }
                                if( elemento.vehiculos.vehiculo[i].lugarRegistro.entidadFederativa === null ) {
                                    elemento.vehiculos.vehiculo[i].lugarRegistro.entidadFederativa = {};
                                }
                                if( elemento.vehiculos.vehiculo[i].formaPago === "CREDITO" ) {
                                    elemento.vehiculos.vehiculo[i].formaPago = "CRÉDITO";
                                }
                                if( elemento.vehiculos.vehiculo[i].formaPago === "NO_APLICA" ) {
                                    elemento.vehiculos.vehiculo[i].formaPago = "NO APLICA";
                                }
                                if( elemento.vehiculos.vehiculo[i].motivoBaja === null ) {
                                    elemento.vehiculos.vehiculo[i].motivoBaja = {};
                                }
                                if( elemento.vehiculos.vehiculo[i].fechaAdquisicion != null ) {
                                    fechaConvertida = elemento.vehiculos.vehiculo[i].fechaAdquisicion.toISOString().substring(0,10);
                                    elemento.vehiculos.vehiculo[i].fechaAdquisicion = fechaConvertida;
                                }
                                // ***
                                if( elemento.vehiculos.vehiculo[i].tercero[0].nombreRazonSocial === null ) {
                                    elemento.vehiculos.vehiculo[i].tercero[0].nombreRazonSocial = "";
                                }
                                if( elemento.vehiculos.vehiculo[i].tercero[0].rfc === null ) {
                                    elemento.vehiculos.vehiculo[i].tercero[0].rfc = "";
                                }
                                if( elemento.vehiculos.vehiculo[i].tercero[0].nombreRazonSocial==="" && 
                                    elemento.vehiculos.vehiculo[i].tercero[0].rfc === "" && 
                                    (   elemento.vehiculos.vehiculo[i].tercero[0].tipoPersona === null || 
                                        elemento.vehiculos.vehiculo[i].tercero[0].tipoPersona === "") 
                                    ){
                                    delete elemento.vehiculos.vehiculo[i].tercero;
                                }
                            }

                        }

                    }else{
                        elemento.vehiculos = {
                            "ninguno": true,
                            "vehiculo": [],
                            "aclaracionesObservaciones":""
                        };
                    }

                    //12.- Bienes muebles
                    //console.log("   12. BIEN MUEBLE");
                    existeValor = getProp(elemento,'bienesMuebles.bienMueble');
                    if (existeValor != null ) {

                        nlongitud = elemento.bienesMuebles.bienMueble.length;
                        //console.log(`      length: (${nlongitud})`);
                        if (nlongitud > 0) {
                            //console.log("   Entre a bien mueble");

                            for (var i = 0; i < nlongitud; i++) {
                                //console.log("   Entre al for de bien mueble");

                                if( elemento.bienesMuebles.bienMueble[i].formaPago === "CREDITO" ) {
                                    elemento.bienesMuebles.bienMueble[i].formaPago = "CRÉDITO";
                                }
                                if( elemento.bienesMuebles.bienMueble[i].formaPago === "NO_APLICA" ) {
                                    elemento.bienesMuebles.bienMueble[i].formaPago = "NO APLICA";
                                }
                                if( elemento.bienesMuebles.bienMueble[i].motivoBaja === null ) {
                                    elemento.bienesMuebles.bienMueble[i].motivoBaja = {};
                                }
                                if( elemento.bienesMuebles.bienMueble[i].fechaAdquisicion != null ) {
                                    fechaConvertida = elemento.bienesMuebles.bienMueble[i].fechaAdquisicion.toISOString().substring(0,10);
                                    elemento.bienesMuebles.bienMueble[i].fechaAdquisicion = fechaConvertida;
                                }
                                // ***
                                if( elemento.bienesMuebles.bienMueble[i].tercero[0].nombreRazonSocial === null ) {
                                    elemento.bienesMuebles.bienMueble[i].tercero[0].nombreRazonSocial = "";
                                }
                                if( elemento.bienesMuebles.bienMueble[i].tercero[0].rfc === null ) {
                                    elemento.bienesMuebles.bienMueble[i].tercero[0].rfc = "";
                                }
                                if( elemento.bienesMuebles.bienMueble[i].tercero[0].tipoPersona === null ||
                                    elemento.bienesMuebles.bienMueble[i].tercero[0].tipoPersona === "") {
                                   if ( elemento.bienesMuebles.bienMueble[i].tercero[0].rfc != "") {
                                       if(elemento.bienesMuebles.bienMueble[i].tercero[0].rfc.length > 12){
                                           elemento.bienesMuebles.bienMueble[i].tercero[0].tipoPersona = "FISICA";
                                       }
                                       if(elemento.bienesMuebles.bienMueble[i].tercero[0].rfc.length == 12){
                                           elemento.bienesMuebles.bienMueble[i].tercero[0].tipoPersona = "MORAL";
                                       }
                                   }else{
                                       elemento.bienesMuebles.bienMueble[i].tercero[0].tipoPersona = "";
                                   }
                               }
                                if( elemento.bienesMuebles.bienMueble[i].tercero[0].nombreRazonSocial==="" && 
                                    elemento.bienesMuebles.bienMueble[i].tercero[0].rfc === "" && 
                                    (   elemento.bienesMuebles.bienMueble[i].tercero[0].tipoPersona === null || 
                                        elemento.bienesMuebles.bienMueble[i].tercero[0].tipoPersona === "") 
                                    ){
                                    delete elemento.bienesMuebles.bienMueble[i].tercero;
                                }

                            }

                        }

                    }else{
                        elemento.bienesMuebles={
                            "ninguno": true,
                            "bienMueble": [],
                            "aclaracionesObservaciones":""
                        }
                    }                    
                    //13.- Inversiones, cuentas bancarias y otro tipo de valores/activos ***
                    //console.log("   13. Inversiones");
                    existeValor = getProp(elemento,'inversionesCuentasValores.inversion');
                    if (existeValor != null ) {

                        nlongitud = elemento.inversionesCuentasValores.inversion.length;
                        //console.log(`      length: (${nlongitud})`);
                        if (nlongitud > 0) {                            
                            for (var i = 0; i < nlongitud; i++) {                                                                                                
                                if( elemento.inversionesCuentasValores.inversion[i].tercero[0].tipoPersona === null ) {
                                    elemento.inversionesCuentasValores.inversion[i].tercero[0].tipoPersona = "";
                                }
                                if( elemento.inversionesCuentasValores.inversion[i].tercero[0].nombreRazonSocial === null ) {
                                    elemento.inversionesCuentasValores.inversion[i].tercero[0].nombreRazonSocial = "";
                                }
                                if( elemento.inversionesCuentasValores.inversion[i].tercero[0].rfc === null ) {
                                    elemento.inversionesCuentasValores.inversion[i].tercero[0].rfc = "";
                                }
                                if( elemento.inversionesCuentasValores.inversion[i].tercero[0].nombreRazonSocial==="" && 
                                    elemento.inversionesCuentasValores.inversion[i].tercero[0].rfc === "" && 
                                    (   elemento.inversionesCuentasValores.inversion[i].tercero[0].tipoPersona === null || 
                                        elemento.inversionesCuentasValores.inversion[i].tercero[0].tipoPersona === "") 
                                    ){
                                    delete elemento.inversionesCuentasValores.inversion[i].tercero;
                                }
                                existeValor = getProp(elemento.inversionesCuentasValores.inversion[i],'localizacionInversion');
                                if (existeValor != null ) {
                                    if (elemento.inversionesCuentasValores.inversion[i].localizacionInversion.rfc === null) {
                                        elemento.inversionesCuentasValores.inversion[i].localizacionInversion.rfc = "";                                        
                                    }
                                    if (elemento.inversionesCuentasValores.inversion[i].localizacionInversion.pais === null) {
                                        elemento.inversionesCuentasValores.inversion[i].localizacionInversion.pais = "";                                        
                                    }
                                }

                            }

                        }

                    }else{
                        elemento.inversionesCuentasValores={
                            "ninguno": true,
                            "inversion": [],
                            "aclaracionesObservaciones":""                            
                        }
                    }   
                    //14.- Adeudos/Pasivos ***
                    //console.log("   14. Adeudos/Pasivos");
                    existeValor = getProp(elemento,'adeudosPasivos.adeudo');
                    if (existeValor != null ) {

                        nlongitud = elemento.adeudosPasivos.adeudo.length;
                        //console.log(`      length: (${nlongitud})`);
                        if (nlongitud > 0) {                            
                            for (var i = 0; i < nlongitud; i++) {                                                                                                                                
                                if( elemento.adeudosPasivos.adeudo[i].tercero[0].nombreRazonSocial === null ) {
                                    elemento.adeudosPasivos.adeudo[i].tercero[0].nombreRazonSocial = "";
                                }
                                if( elemento.adeudosPasivos.adeudo[i].tercero[0].rfc === null ) {
                                    elemento.adeudosPasivos.adeudo[i].tercero[0].rfc = "";
                                }
                                if( elemento.adeudosPasivos.adeudo[i].tercero[0].nombreRazonSocial==="" && 
                                    elemento.adeudosPasivos.adeudo[i].tercero[0].rfc === "" && 
                                    (   elemento.adeudosPasivos.adeudo[i].tercero[0].tipoPersona === null || 
                                        elemento.adeudosPasivos.adeudo[i].tercero[0].tipoPersona === "") 
                                    ){
                                    delete elemento.adeudosPasivos.adeudo[i].tercero;
                                }
                            }

                        }

                    }else{
                        elemento.adeudosPasivos={
                            "ninguno": true,
                            "adeudo": [],
                            "aclaracionesObservaciones":""
                        }
                    }  

                    //15.- Préstamo o comodato por terceros ***
                    //console.log("   15. Préstamo o comodato por terceros ");
                    existeValor = getProp(elemento,'prestamoComodato.prestamo');
                    if (existeValor != null ) {

                        nlongitud = elemento.prestamoComodato.prestamo.length;
                        //console.log(`      length: (${nlongitud})`);
                        if (nlongitud > 0) {                            
                            for (var i = 0; i < nlongitud; i++) {                                                                                                                                
                                existeValor = getProp(elemento.prestamoComodato.prestamo[i],'tipoBien.inmueble');
                                if (existeValor != null ) {
                                    existeValor = getProp(elemento.prestamoComodato.prestamo[i],'tipoBien.inmueble.domicilioMexico');
                                    if (existeValor != null ) {
                                        if( elemento.prestamoComodato.prestamo[i].tipoBien.inmueble.domicilioMexico.numeroInterior  === null) {
                                            elemento.prestamoComodato.prestamo[i].tipoBien.inmueble.domicilioMexico.numeroInterior = "";
                                        }                                                               
                                    }
                                    if( elemento.prestamoComodato.prestamo[i].tipoBien.inmueble.domicilioExtranjero  === null) {
                                        elemento.prestamoComodato.prestamo[i].tipoBien.inmueble.domicilioExtranjero = {};                                        
                                    }
                                    existeValor = getProp(elemento.prestamoComodato.prestamo[i],'tipoBien.inmueble.domicilioExtranjero');
                                    if (existeValor != null ) {
                                        
                                        if( elemento.prestamoComodato.prestamo[i].tipoBien.inmueble.domicilioExtranjero.numeroInterior  === null) {
                                            elemento.prestamoComodato.prestamo[i].tipoBien.inmueble.domicilioExtranjero.numeroInterior = "";                                        
                                        }
                                    }
                                                          
                                    if( elemento.prestamoComodato.prestamo[i].tipoBien.vehiculo  === null) {
                                        elemento.prestamoComodato.prestamo[i].tipoBien.vehiculo = {};
                                    }                                                               
                                }                          
                                existeValor = getProp(elemento.prestamoComodato.prestamo[i],'tipoBien.vehiculo');
                                if (existeValor != null ) {                                    
                                    if( elemento.prestamoComodato.prestamo[i].tipoBien.inmueble  === null) {
                                        elemento.prestamoComodato.prestamo[i].tipoBien.inmueble = {};
                                    }                                                               
                                }    
                                
                            }

                        }

                    }else{
                        elemento.prestamoComodato={
                            "ninguno": true,
                            "prestamo": [],
                            "aclaracionesObservaciones":""
                        }
                    }   

                    // 1.- Participación en empresas, sociedades o asociaciones ***
                    //console.log("   1. Participación en empresas, sociedades o asociaciones ");
                    existeValor = getProp(elemento,'participacion.participacion');
                    if (existeValor != null ) {

                        nlongitud = elemento.participacion.participacion.length;
                        //console.log(`      length: (${nlongitud})`);
                        if (nlongitud > 0) {                            
                            for (var i = 0; i < nlongitud; i++) {                                                                                                                                
                                existeValor = getProp(elemento.participacion.participacion[i],'montoMensual');
                                if (existeValor != null ) {
                                    if( elemento.participacion.participacion[i].montoMensual.moneda  === null) {
                                        elemento.participacion.participacion[i].montoMensual.moneda = "";
                                    }                                                                                                   
                                }
                                if( elemento.participacion.participacion[i].tipoOperacion  === null) {
                                    elemento.participacion.participacion[i].tipoOperacion = "";
                                }  
                                existeValor = getProp(elemento.participacion.participacion[i],'ubicacion');
                                if (existeValor != null ) {
                                    if( elemento.participacion.participacion[i].ubicacion.pais  === null) {
                                        elemento.participacion.participacion[i].ubicacion.pais = "";
                                    }                                                                                                   
                                }                                                                                                 
                            }

                        }

                    } 
                    // 2.-¿Participa en la toma de decisiones de alguna de esas instituciones

                    // 3.- Apoyos o beneficios públicos ***
                    //console.log("   3. Apoyos o beneficios públicos");
                    existeValor = getProp(elemento,'apoyos.apoyo');
                    if (existeValor != null ) {

                        nlongitud = elemento.apoyos.apoyo.length;
                        //console.log(`      length: (${nlongitud})`);
                        if (nlongitud > 0) {                            
                            for (var i = 0; i < nlongitud; i++) {                                                                                                                                
                                existeValor = getProp(elemento.apoyos.apoyo[i],'montoApoyoMensual');
                                if (existeValor != null ) {
                                    if( elemento.apoyos.apoyo[i].montoApoyoMensual.moneda  === null) {
                                        elemento.apoyos.apoyo[i].montoApoyoMensual.moneda = "";
                                    }                                                                                                   
                                }                                                                                                                               
                            }

                        }

                    } 
                    // 4.- Representación
                    //console.log("   4. Representación ");
                    existeValor = getProp(elemento,'representaciones.representacion');
                    if (existeValor != null ) {

                        nlongitud = elemento.representaciones.representacion.length;
                        //console.log(`      length: (${nlongitud})`);
                        if (nlongitud > 0) {                            
                            for (var i = 0; i < nlongitud; i++) {                                                                                                                                
                                existeValor = getProp(elemento.representaciones.representacion[i],'montoMensual');
                                if (existeValor != null ) {
                                    if( elemento.representaciones.representacion[i].montoMensual.moneda  === null) {
                                        elemento.representaciones.representacion[i].montoMensual.moneda = "";
                                    }                                                                                                   
                                }
                                if( elemento.representaciones.representacion[i].tipoOperacion  === null) {
                                    elemento.representaciones.representacion[i].tipoOperacion = "";
                                }  
                                existeValor = getProp(elemento.representaciones.representacion[i],'ubicacion');
                                if (existeValor != null ) {
                                    if( elemento.representaciones.representacion[i].ubicacion.pais  === null) {
                                        elemento.representaciones.representacion[i].ubicacion.pais = "";
                                    }                                                                                                   
                                }                                                                                                 
                            }

                        }

                    } 
                    // 5.- Clientes principales
                    // 6.- Beneficios privados
                    // 7.- Fideicomisos

                    //console.log("   sali de los ifs y de los fors");
                    //**************************************************************//
                    

                    newstrippedRows.push({
                    
                        id: elemento['id'],

                        metadata : {
                            actualizacion: elemento['updatedAt'],
                            institucion: "Sistema Estatal de Combate a la Corrupción",
                            tipo:elemento['tipoDeclaracion'],
                            declaracionCompleta: elemento['declaracionCompleta'],
                            actualizacionConflictoInteres: false                            
                        },

                        declaracion :{

                            situacionPatrimonial : {

                                datosGenerales: elemento['datosGenerales'],
                                domicilioDeclarante: elemento['domicilioDeclarante'],
                                datosCurricularesDeclarante: elemento['datosCurricularesDeclarante'],
                                datosEmpleoCargoComision: elemento['datosEmpleoCargoComision'],
                                experienciaLaboral: elemento['experienciaLaboral'],
                                datosPareja: elemento['datosPareja'],
                                datosDependientesEconomicos: elemento['datosDependientesEconomicos'],
                                ingresos: elemento['ingresos'],
                                actividadAnualAnterior: elemento['actividadAnualAnterior'],
                                bienesInmuebles: elemento['bienesInmuebles'],
                                vehiculos: elemento['vehiculos'],
                                bienesMuebles: elemento['bienesMuebles'],
                                inversiones: elemento['inversionesCuentasValores'],
                                adeudos: elemento['adeudosPasivos'],
                                prestamoOComodato: elemento['prestamoComodato']

                            },

                            intereses : {

                                participacion: elemento['participacion'],
                                participacionTomaDecisiones: elemento['participacionTomaDecisiones'],
                                apoyos: elemento['apoyos'],
                                representaciones: elemento['representaciones'],
                                clientesPrincipales: elemento['clientesPrincipales'],
                                beneficiosPrivados: elemento['beneficiosPrivados'],
                                fideicomisos: elemento['fideicomisos']

                            }

                        }

                    });                
                //console.log("   sali del push del arreglo con los datos modificados y agregados");
   
            }
            console.log("---------------------------------");
 
            //console.log("resultados de newobjresults");
            //console.log(newstrippedRows);
            //console.log("***********************");

            strippedRows = newstrippedRows;

            let objResponse= {};
            objResponse["pagination"] = objpagination;
            objResponse["results"] = strippedRows;            

            //console.log("++++++++++++++++++++");
            //console.log("adelante del TRY objResponse");
            //console.log(objResponse);
            //console.log("++++++++++++++++++++");
            //console.log(typeof objResponse);

            console.log(objpagination);
            console.log("Datos enviados +++++++++++++++++++++++++++++++++++++++++++>");
            console.log(" ");

            return objResponse;
         /* }else{
            //throw new RangeError("Error campo pageSize fuera de rango, el rango del campo es 1..200 ");            
        } */
    }
}
module.exports.post_declaraciones = post_declaraciones;