class Printer{
    constructor(name, marca, modelo, serial, url, nivel_toner, paginas){
        this.marca = marca;    
        this.modelo = modelo;
        this.serial = serial;
        this.url = url;
        this.nivel_toner = nivel_toner;
        this.paginas = paginas;
        this.status = "Online ";
        this.id = null;
        }


}
export {Printer}