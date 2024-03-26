// Ejemplo de comando ->  node parse2024.js 409701  
// (409701 es el nombre del archivo que contiene los horarios de una carrera)

// compruebo si se tienen todos los parámetros del comando
if (process.argv.length < 3) {
    console.log('no parameters found');
    process.exit(1);
}

// nombre del archivo
const file=process.argv[2]
// ruta del pdf
const pathPDF='data/FCyT/2024-01/'+file+'.pdf';
// ruta del futuro json
const pathJSON='data/FCyT/2024-01/'+file+'.json';


const fs=require('fs')
// libreria para parsear, validar ,manipular y formatear fechas
const moment=require('moment')
// libreria para extraer el texto de un pdf
const pdfText=require('pdf-text')

const cases=[{
        // expresion regular que matchea con el texto FACULTAD DE CIENCIAS Y TEC...
        regex:/Facultad de Ciencias y Tecnolog(.{1})a-UMSS/
    },{
        // 1 del 2024
        // colocas semester: 1/2024
        regex:/(\d{1}) del (20\d{2})/,
        parse:(result)=>{
            json.semester=result[1]+'/'+result[2];
        }
    },{
        // 1 del 2024
        // colocas semester: 1/2024
        regex:/GESTION (\d{1})\/(20\d{2})/,
        parse:(result)=>{
            json.semester=result[1]+'/'+result[2];
        }
    },{
        regex:/Horario de Clases por Plan de estudios/
    },{
        // número de pagina del pdf 1 de 9   (1 de 9 semestres por ejemplo)
        regex:/\d{1} de \d{1}/
    },{
        // fecha y hora, ejemplo 5/3/2024 17:03
        regex:/\d{1,2}\/\d{1,2}\/\d{4} \d{2}:\d{2}/
    },{
        // nivel
        // Recorremos fila por fila
        regex:/Nivel/,
        parse:(result)=>{
            // agrego el String "level" al arreglo headers
            headers.push('level');
        }
    },{
        // OJO, SE OMITE EL CÓDIGO DE LA MATERIA
        regex:/Materia/,
        parse:(result)=>{
            // agrego el String "subject" al arreglo headers
            headers.push('subject');
        }
    },{
        regex:/Grupo/,
        parse:(result)=>{
            // agrego el String "group" al arreglo headers
            headers.push('group');
        }
    },{
        regex:/^DIA$/,
        parse:(result)=>{
        // agrego el String "day" al arreglo headers
            headers.push('day');
        }
    },{
        regex:/Hora Ambiente/,
        parse:(result)=>{
        // agrego el String "Hora Ambiente" al arreglo headers
            headers.push('time');
        }
    },{
        regex:/Tipo/,
        parse:(result)=>{
        // agrego el String "type" al arreglo headers
            headers.push('type');
        }
    },{
        regex:/Docente/,
        parse:(result)=>{
        // agrego el String "teacher" al arreglo headers
            headers.push('teacher');
        }
    },{
        regex:/^Carrera: *$/
    },{

        /**
         * SE RECUPERA EL NOMBRE EN LA PROPIEDAD name del objeto json no importa su es:
         *  CARRERA, LICENCIATURA O PROGRAMA
         */

        /* career */
        regex:/^Carrera: *([A-Z .\(\)]+)$/,
        parse:(result)=>{
            json.name=result[1]
            .replace(/\s+/g, ' ')
            .trim();
        }
    },{
        regex:/(LICENCIATURA .*)/,
        parse:(result)=>{
            json.name=result[0]
            .replace(/\s+/g, ' ')
            .trim();
        }
    },{
        regex:/(PROGRAMA .*)/,
        parse:(result)=>{
            json.name=result[0]
            .replace(/\s+/g, ' ')
            .trim();
        }
    },{
        /* day */

        /**
         * {
            "madeIn": "SCESI UMSS",
            "support": "@georg",
            "code": "114071",
            "levels": [
                {
                    "code": "A",
                    "subjects": [
                        {
                            "code": "2002004",
                            "name": "BIOLOGIA GENERAL",
                            "groups": [
                                {
                                    "code": "1",
                                    "schedule": [
                                        {
                                            "day": "LU",
         */
        // Establezco el dia del primer horario y 
        regex:/^(LU|MA|MI|JU|VI|SA)$/,
        parse:(result)=>{
            indexSchedule=json
            .levels[indexLevel]
            .subjects[indexSubject]
            .groups[indexGroup]
            .schedule
            .push({
                day:result[1]
            })-1;
            // me voy moviendo por la fila
            row=(headers.length===column+1)?row++:row;
            column=(column+1)%headers.length;
        }
    },{
        /**
         * ESTE PROCESO ESCRIBE UN ARREGLO DE NIVELES 
         * Y ACTUALIZA UN INDICE DE NIVELES
         * 
         */


        /* level; type; group */
        // expresion regular para obetener niveles, grupos o tipos
        regex:/^ *(\d{1,2}|[A-Z]{1}|[A-Z]{1}\d{1}|\d{1}[A-Z]{1}) *$/,
        parse:(result)=>{
            let index;

            switch(headers[column]){
                
                // si el puntero column me indica que estoy en la columna levels
                // level es un arreglo de niveles, cada uno contiene un código y materias del nivel
                // code: A, materias: [Intro a programación, Fisica general,...]
                case 'level':
                    index=json
                    .levels
                    .findIndex((item)=>{
                        // busco el indice de un nivel cuyo codigo sea A o B o ....
                        return item.code===result[1];
                    });
                    
                    // si no encontre el índice, agrego un nuevo nivel con el código respectivo ejemplo E
                    // el nuevo nivel tendra 0 materias inicialmente
                    if(index<0){
                        indexLevel=json
                        .levels
                        .push({
                            code:result[1],
                            subjects:[]
                        })-1;
                    }else{
                        // sino actualizo el indice del nivel, del arreglo de niveles
                        indexLevel=index;
                    }

                    break;

                // si se trata de un grupo, uso el índice de niveles y el índice de materias para
                // en caso de no tener registrado este grupo lo registro

                /**
                 * {
                    "madeIn": "SCESI UMSS",
                    "support": "@georg",
                    "code": "114071",
                    "levels": [
                        {
                            "code": "A",
                            "subjects": [
                                {
                                    "code": "2002004",
                                    "name": "BIOLOGIA GENERAL",
                                    "groups": [
                                        {
                                            "code": "1",
                                            "schedule": [
                 */
                case 'group':
                    index=json
                    .levels[indexLevel]
                    .subjects[indexSubject]
                    .groups
                    .findIndex((item)=>{
                        return item.code===result[1];
                    });

                    if(index<0){
                        indexGroup=json
                        .levels[indexLevel]
                        .subjects[indexSubject]
                        .groups
                        .push({
                            code:result[1],
                            schedule:[]
                        })-1;
                    }else{
                        indexGroup=index;
                    }

                    break;
                /**
                 * {
                    "madeIn": "SCESI UMSS",
                    "support": "@georg",
                    "code": "114071",
                    "levels": [
                        {
                            "code": "A",
                            "subjects": [
                                {
                                    "code": "2002004",
                                    "name": "BIOLOGIA GENERAL",
                                    "groups": [
                                        {
                                            "code": "1",
                                            "schedule": [
                */
                case 'type':
                    json
                    .levels[indexLevel]
                    .subjects[indexSubject]
                    .groups[indexGroup]
                    .schedule[indexSchedule]
                    .isClass=(result[1]==='C');

                    break;
            }

            row=(headers.length===column+1)?row++:row;
            column=(column+1)%headers.length;
        }
    },{
        /* codigo de la materia */
        // crea una materia de un nivel
        // inicialmente tendra el codigo, nombre vacio y 0 grupos
        regex:/(\d{7})/,
        parse:(result)=>{
            const index=json
            .levels[indexLevel]
            .subjects
            .findIndex((item)=>{
                return item.code===result[1];
            });

            if(index<0){
                indexSubject=json
                .levels[indexLevel]
                .subjects
                .push({
                    code:result[1],
                    name:'',
                    groups:[]
                })-1;
            }else{
                indexSubject=index;
            }

            hasCodeSubject=true;

            row=(headers.length===column+1)?row++:row;
            column=(column+1)%headers.length;
        }
    },{
        /* schedule */
        regex:/(\d{3,4})\ *-(\d{3,4})\ *\((.*)\)/,
        parse:(result)=>{
            // establezo la hora de inicio, hora de fin  del horario, del grupo, de la materio en el nivel X
            json
            .levels[indexLevel]
            .subjects[indexSubject]
            .groups[indexGroup]
            .schedule[indexSchedule]
            .start=result[1];

            json
            .levels[indexLevel]
            .subjects[indexSubject]
            .groups[indexGroup]
            .schedule[indexSchedule]
            .end=result[2];

            const start=moment(result[1],'hmm'),
                end=moment(result[2],'hmm'),
                diff=end.diff(start,'minutes');

            json
            .levels[indexLevel]
            .subjects[indexSubject]
            .groups[indexGroup]
            .schedule[indexSchedule]
            .duration=diff/45;

            json
            .levels[indexLevel]
            .subjects[indexSubject]
            .groups[indexGroup]
            .schedule[indexSchedule]
            .room=result[3];

            row=(headers.length===column+1)?row++:row;
            column=(column+1)%headers.length;
        }
    },{
        /* subject;teacher */
        regex:/([A-ZÑ\(\) \.]*)/,
        parse:(result)=>{
            switch(headers[column]){
                case 'subject':
                    const index=json
                    .levels[indexLevel]
                    .subjects
                    .findIndex((item)=>{
                        return item.name===result[1];
                    });

                    if(index<0){
                        if(!hasCodeSubject){
                            indexSubject=json
                            .levels[indexLevel]
                            .subjects
                            .push({
                                code:'',
                                name:result[1],
                                groups:[]
                            })-1;
                        }else{
                            json
                            .levels[indexLevel]
                            .subjects[indexSubject]
                            .name=result[1];
                        }
                    }

                    break;
                case 'teacher':
                    json
                    .levels[indexLevel]
                    .subjects[indexSubject]
                    .groups[indexGroup]
                    .schedule[indexSchedule]
                    .teacher=result[1];

                    break;
            }


            row=(headers.length===column+1)?row++:row;
            column=(column+1)%headers.length;
        }
    }];

let headers=[],
    column=0,
    row=0,
    indexLevel=-1,
    hasCodeSubject=false,
    indexSubject=-1,
    indexGroup=-1,
    indexSchedule=-1,
    json={
        madeIn:'SCESI UMSS',
        support:'@georg',
        code:process.argv[2],
        levels:[]
    };



// chunks: String[]

pdfText(pathPDF,(error,chunks)=>{
    chunks
    // para cada palabra
    .forEach((line)=>{
        // result: boolean
        // 
        const result=cases
        // item : { regex, parse }
        // some indica si almenos una expresion regular matcheo la palabra y ejecuto su fincion parse
        // por ese motivo existen expresiones regulares sin parse
        .some((item)=>{
            // si la palabra matchea con la epxresion regular de las muchas
            if(item.regex.test(line)){
                // si existe una funcion parse para ejecutar
                if(item.parse){
                    // lleva a cabo la funcion parse pasandole el resultado de la ejecucion de la expresion regular
                    item.parse(item.regex.exec(line));
                }

                return true;
            }else{
                return false;
            }
        });

        // sino notifico que palabra no matcheo
        if(!result){
            console.log('NO MATCH',line);
        }

        /* groups.teacher fill */
        json
        .levels
        .forEach((level)=>{
            level
            .subjects
            .forEach((subject)=>{
                subject
                .groups
                .forEach((group)=>{
                    group.teacher=group
                    .schedule
                    .filter((item)=>{
                        return item.isClass;
                    })
                    .reduce((sum,item)=>{
                        if(!sum.includes(item.teacher)){
                            sum.push(item.teacher);
                        }

                        return sum;
                    },[])
                    .join(' - ');

                    if(!group.teacher){
                        /* if all types are P */
                        group.teacher=group
                        .schedule
                        .reduce((sum,item)=>{
                            if(!sum.includes(item.teacher)){
                                sum.push(item.teacher);
                            }

                            return sum;
                        },[])
                        .join(' - ');
                    }
                });
            });
        });
    });

    fs.writeFile(
        pathJSON,
        JSON.stringify(json,null,4),
        (error)=>{
            if(error){
                throw error;
            }

            console.log('  > file %s.pdf saved',file);
        }
    );
});
