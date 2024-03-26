// Ejemplo de comando de ejecución -> node parse2024.js 409701

// Si no se tienen los 3 componentes del comando, no hacer nada
if(process.argv.length<3){
    console.log('no parameters found');
    process.exit(1);
}

// funcion que permite obtener el HTML de una página 
const request=require('request')
const fs=require('fs')

const join=require('path').join
const url='http://www.fcyt.umss.edu.bo/horarios/'
// obtener el código de la carrera 
const gestion=process.argv[2]
const today = new Date().toLocaleString()
// los horarios de una carrera de la facultad
const path=join(__dirname,'data','FCyT',gestion)
// objeto json que hace referencia a todos los archivos de con los horarios de las carreras y su URL
const path_body=join(__dirname,'body')
// expresion regular que busca el enlace de descarga de los horarios en el HTML de la página de horarios de la FCYT
const regex=/<a href="(.*)">(.*\.pdf)<\/a>/g

// expresion regular que busca el enlace de descarga de los horarios en el HTML de la página de horarios de la FCYT
const regexp = />(\d* .*)<\/f.*\r*\n*.*href="(.*)">(.*.pdf).*\r*\n*.*>(\d+:\d+) ((\d+)-(\d+)-(\d+))</gu

const get = () => {
        console.log('request fcyt index ...');
        // solicito el HTML
        request( url, (error, response, body)=>{
            if(error){
                throw error;
            }

            console.log('parsing fcyt index ...');
            // si la respuesta es OK
            if(response.statusCode == 200){
                //muestro el HTML
                console.log(body.length)

                // el buffer es una lista de objetos que contienen los metadatos de los
                //horarios(enlace, nombre del pdf, hora de actualización, etc)
                var buffer = new Array()
                var result
                // busco en la página de horarios
                // tengo 19 horarios de las 19 carreras
                while((result = regexp.exec(body)) !== null){
                    console.log(result)
                    
                    buffer.push({
                        curriculum: result[1] 
                        , url:result[2]
                        , name:result[3]
                        , time:result[4]
                        , date: {
                            day: result[6],
                            month: result[7],
                            year: result[8]
                        },
                    });
                }
                console.log(buffer, !buffer.length? 'no found pdf': '');
                console.log("downloading fcyt index");

                // si al menos recupere un horario con éxito 
                if (buffer.length>0){
                    // creo un objeto que contendra la información del proceso de obtención de los pdfs
                    res = {
                        madeIn:"SCESI UMSS",
                        semester:gestion,
                        date: today,
                        support:"@georg",
                        index: buffer
                    }
                        // guardo el contenido del objeto en un archivo index.json 
                        fs.appendFileSync(join(path_body,'index.json'),JSON.stringify(res,null,4));
                }
                
                buffer.forEach((element)=>{
                    // muestro en consola el nombre de cada horario que encontre
                    console.log('saved: '+element.name);
                        // solicito el contenido del enlace de descarga
                        request(element.url).pipe(
                            // una vez que tenga el contenido, lo guardo en un archivo en la ruta de la gestion
                            // ejemplo: proyecyo/data/FCyT/2024-01/114071.pdf
                            fs.createWriteStream(join(path,element.name)));
                });
            }
        });
}




// compruebo si existe la ruta  proyecyo/data/FCyT/2024-01
fs.stat(path,(error,stats)=>{
    // compruebo si existe la ruta proyecto/body
    fs.stat(path_body,(error,stats)=>{
        // si no existe lo creo
        if (error) fs.mkdir(path, { recursive: true }, (error)=>{

        })
    })
    if(error){
        // si no existe la ruta proyecto/data/FCYT/2024-01
        console.log('::::::::::error:', {path} ,{error})
        // lo creo
        fs.mkdir(path, { recursive: true }, (error)=>{
            if (error ) console.log(';;;;;error mkdir:', {error})
            // vuelvo a intentar hacer toooodo desde 0
            get();
        });
    }else{
        // vuelvo a intentar hacer toooodo desde 0
        get();
    }
});