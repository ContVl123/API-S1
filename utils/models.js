const { Schema, model } = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const declaracionSchema = new Schema({

    // 1. Datos generales
    firmada:Boolean,
    
    datosGenerales: {

        nombre: String,
        primerApellido: String,
        segundoApellido: String,
        curp: String,
        rfc: {
            rfc: String,
            homoClave: String
        },
        correoElectronico: {
            institucional: String,
            personal: String
        },
        telefono: {
            casa: String,
            celularPersonal: String
        },
        situacionPersonalEstadoCivil: {
            clave: String,
            valor: String
        },
        regimenMatrimonial: {
            clave: String,
            valor: String
        },
        paisNacimiento: String,
        nacionalidad: String,
        aclaracionesObservaciones: String

    },

    // 2.- Domicilio del declarante

    domicilioDeclarante: {

        domicilioMexico: {
            calle: String,
            numeroExterior: String,
            numeroInterior: String,
            coloniaLocalidad: String,
            municipioAlcaldia: {
                clave: String,
                valor: String
            },
            entidadFederativa: {
                clave: String,
                valor: String
            },
            codigoPostal: String
        },

        domicilioExtranjero: {
            calle: String,
            numeroExterior: String,
            numeroInterior: String,
            ciudadLocalidad: String,
            estadoProvincia: String,
            pais: String,
            codigoPostal: String
        },
        aclaracionesObservaciones: String
    },

    // 3.- Datos curriculares del declarante 

    datosCurricularesDeclarante: {
        escolaridad: { type: [], default: void 0 },
        aclaracionesObservaciones: String
    },

    // 4.- Datos del empleo, cargo o comisión que inicia

    datosEmpleoCargoComision: {
        tipoOperacion: String,
        nivelOrdenGobierno: String,
        ambitoPublico: String,
        nombreEntePublico: String,
        areaAdscripción: String,
        empleoCargoComision: String,
        contratadoPorHonorarios: Boolean,
        nivelEmpleoCargoComision: String,
        funcionPrincipal: String,
        fechaTomaPosesion: String,
        telefonoOficina: {
            telefono: String,
            extension: String
        },
        domicilioMexico: {
            calle: String,
            numeroExterior: String,
            numeroInterior: String,
            coloniaLocalidad: String,
            municipioAlcaldia: {
                clave: String,
                valor: String
            },
            entidadFederativa: {
                clave: String,
                valor: String
            },
            codigoPostal: String
        },
        domicilioExtranjero: {
            calle: String,
            numeroExterior: String,
            numeroInterior: String,
            ciudadLocalidad: String,
            estadoProvincia: String,
            pais: String,
            codigoPostal: String
        },
        aclaracionesObservaciones: String
    },

    // 5.- Experiencia laboral (últimos cinco empleos)
    experienciaLaboral: {
        ninguno: Boolean,
        experiencia: { type: [], default: void 0 },
        aclaracionesObservaciones: String
    },

    // 6.- Datos de la pareja

    datosPareja: {
        ninguno: Boolean,
        tipoOperacion: String,
        nombres: String,
        primerApellido: String,
        segundoApellido: String,
        fechaNacimiento: String,
        rfc: String,
        relacionConDeclarante: String,
        ciudadanoExtranjero: Boolean,
        curp: String,
        esDependienteEconomico: Boolean,
        habitaDomicilioDeclarante: Boolean,
        lugarDondeReside: String,
        domicilioMexico: {
            calle: String,
            numeroExterior: String,
            numeroInterior: String,
            coloniaLocalidad: String,
            municipioAlcaldia: {
                clave: String,
                valor: String
            },
            entidadFederativa: {
                clave: String,
                valor: String
            },
            codigoPostal: String
        },
        domicilioExtranjero: {
            calle: String,
            numeroExterior: String,
            numeroInterior: String,
            ciudadLocalidad: String,
            estadoProvincia: String,
            pais: String,
            codigoPostal: String
        },
        actividadLaboral: {
            clave: String,
            valor: String
        },
        actividadLaboralSectorPublico: {
            nivelOrdenGobierno: String,
            ambitoPublico: String,
            nombreEntePublico: String,
            areaAdscripción: String,
            empleoCargoComision: String,
            funcionPrincipal: String,
            fechaIngreso: Date,
            salarioMensualNeto: {
                valor: Number,
                moneda: String
            },
        },
        actividadLaboralSectorPrivadoOtro: {
            nombreEmpresaSociedadAsociacion: String,
            empleoCargoComision: String,
            rfc: String,
            fechaIngreso: Date,
            sector: {
                clave: String,
                valor: String
            },
            salarioMensualNeto: {
                valor: Number,
                moneda: String,
                proveedorContratistaGobierno: Boolean
            },
        },
        aclaracionesObservaciones: String
    },

    // 7.- Datos del dependiente económico

    datosDependientesEconomicos: {
        ninguno: Boolean,
        dependienteEconomico: { type: [], default: void 0 },
        aclaracionesObservaciones: String
    },

    // 8.- Ingresos netos del declarante, pareja y/o dependendientes económicos

    ingresos: {
        remuneracionMensualCargoPublico: {
            valor: Number,
            moneda: String
        },
        otrosIngresosMensualesTotal: {
            valor: Number,
            moneda: String
        },
        actividadIndustialComercialEmpresarial: {
            remuneracionTotal: {
                valor: Number,
                moneda: String
            },
        },
        actividades: {
            remuneracion: {
                valor: Number,
                moneda: String
            },
            nombreRazonSocial: String,
            tipoNegocio: String
        },
        actividadFinanciera: {
            remuneracionTotal: {
                valor: Number,
                moneda: String
            },
            actividades: {
                remuneracion: {
                    valor: Number,
                    moneda: String
                },
                tipoInstrumento: {
                    clave: String,
                    valor: String
                },
            },

        },
        serviciosProfesionales: {
            remuneracionTotal: {
                valor: Number,
                moneda: String
            },
            servicios: {
                remuneracion: {
                    valor: Number,
                    moneda: String
                },
                tipoServicio: String
            },
        },
        otrosIngresos: {
            remuneracionTotal: {
                valor: Number,
                moneda: String
            },
        },
        ingresos: {
            remuneracion: {
                valor: Number,
                moneda: String
            },
            tipoingreso: String
        },
        ingresoMensualNetoDeclarante: {
            valor: Number,
            moneda: String
        },
        ingresoMensualNetoParejaDependiente: {
            valor: Number,
            moneda: String
        },
        totalIngresosMensualesNetos: {
            valor: Number,
            moneda: String
        },
        aclaracionesObservaciones: String
    },

    // 9.- Te desempeñaste como servidor público en el año inmediato anterior?

    actividadAnualAnterior: {
        servidorPublicoAnioAnterior: Boolean,
        fechaIngreso: Date,
        fechaConclusion: Date,
        remuneracionNetaCargoPublico: {
            valor: Number,
            moneda: String
        },
        otrosIngresosTotal: {
            valor: Number,
            moneda: String
        },
        actividadIndustialComercialEmpresarial: {
            remuneracionTotal: {
                valor: Number,
                moneda: String
            },
            actividades: {
                remuneracion: {
                    valor: Number,
                    moneda: String
                },
                nombreRazonSocial: String,
                tipoNegocio: String
            }
        },
        actividadFinanciera: {
            remuneracionTotal: {
                valor: Number,
                moneda: String
            },
            actividades: {
                remuneracion: {
                    valor: Number,
                    moneda: String
                },
                tipoInstrumento: {
                    valor: Number,
                    moneda: String
                }
            }
        },
        serviciosProfesionales: {
            remuneracionTotal: {
                valor: Number,
                moneda: String
            },
            servicios: {
                remuneracion: {
                    valor: Number,
                    moneda: String
                },
            }
        },
        enajenacionBienes: {
            remuneracionTotal: {
                valor: Number,
                moneda: String
            },
            bienes: {
                remuneracion: {
                    valor: Number,
                    moneda: String
                },
                tipoBienEnajenado: String
            }
        },
        otrosIngresos: {
            remuneracionTotal: {
                valor: Number,
                moneda: String
            },
            ingresos: {
                remuneracion: {
                    valor: Number,
                    moneda: String
                },
                tipoingreso: String
            }
        },
        ingresoNetoAnualDeclarante: {
            valor: Number,
            moneda: String
        },
        ingresoNetoAnualParejaDependiente: {
            valor: Number,
            moneda: String
        },
        totalIngresosNetosAnuales: {
            valor: Number,
            moneda: String
        },
        aclaracionesObservaciones: String
    },

    //10.- Bienes inmuebles(Situación actual)

    bienesInmuebles: {
        ninguno: Boolean,
        bienInmueble: { type: [], default: void 0 },
        aclaracionesObservaciones: String
    },

    //11.- Vehículos

    vehiculos: {
        ninguno: Boolean,
        vehiculo: { type: [], default: void 0 },
        aclaracionesObservaciones: String
    },

    //12.- Bienes muebles

    bienesMuebles: {
        ninguno: Boolean,
        bienMueble: { type: [], default: void 0 },
        aclaracionesObservaciones: String
    },

    //13.- Inversiones, cuentas bancarias y otro tipo de valores/activos

    inversionesCuentasValores: {
        ninguno: Boolean,
        inversion: { type: [], default: void 0 },
        aclaracionesObservaciones: String
    },

    //14.- Adeudos/Pasivos

    inversionesCuentasValores: {
        ninguno: Boolean,
        inversion: { type: [], default: void 0 },
        aclaracionesObservaciones: String
    },

    //15.- Préstamo o comodato por terceros

    inversionesCuentasValores: {
        ninguno: Boolean,
        adeudo: { type: [], default: void 0 },
        aclaracionesObservaciones: String
    },


    // 1.- Participación en empresas, sociedades o asociaciones

    participacion: {
        ninguno: Boolean,
        participación: { type: [], default: void 0 },
        aclaracionesObservaciones: String
    },

    // 2.-¿Participa en la toma de decisiones de alguna de esas instituciones?

    participacionTomaDecisiones: {
        ninguno: Boolean,
        participación: { type: [], default: void 0 },
        aclaracionesObservaciones: String
    },

    // 3.- Apoyos o beneficios públicos

    apoyos: {
        ninguno: Boolean,
        apoyo: { type: [], default: void 0 },
        aclaracionesObservaciones: String
    },

    // 4.- Representación

    representaciones: {
        ninguno: Boolean,
        representacion: { type: [], default: void 0 },
        aclaracionesObservaciones: String
    },

    // 5.- Clientes principales

    clientesPrincipales: {
        ninguno: Boolean,
        cliente: { type: [], default: void 0 },
        aclaracionesObservaciones: String
    },

    // 6.- Beneficios privados

    beneficiosPrivados: {
        ninguno: Boolean,
        beneficio: { type: [], default: void 0 },
        aclaracionesObservaciones: String
    },

    // 7.- Fideicomisos

    fideicomisos: {
        ninguno: Boolean,
        fideicomiso: { type: [], default: void 0 },
        aclaracionesObservaciones: String
    }

}, { collection: 'declaraciones' });

declaracionSchema.plugin(mongoosePaginate);

let Declaracion = model('Declaracion', declaracionSchema);

module.exports = {
    declaracionSchema,
    Declaracion
};