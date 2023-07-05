import {Printer} from './Printer.js';
class Mensagem{
    constructor(){
        this.texto = "";
        this.impressora = null;
        this.status = 'NAO_LIDA';
    }
    get_numero(){ return this.numero;}
    get_texto(){ return this.texto}
    set_texto(texto){this.texto = texto}
    get_impressora(){ return this.impressora}
    get_status(){ return this.status}
    set_status(status){this.status = status};

    compor_mensagem(mensagem_zap){
        try{
        let linhas = mensagem_zap.split("\n");
        this.texto = linhas.shift();

        var impressora = new Printer();
        impressora.marca = linhas.shift().split(' ')[1];
        impressora.modelo = linhas.shift().split(' ')[1];
        impressora.serial = linhas.shift().split(' ')[1];;
        impressora.url = linhas.shift().split(' ')[1];
        impressora.nivel_toner = linhas.shift().split(' ')[3];
        linhas.shift();
        impressora.paginas = linhas.shift().split(' ')[2];
        this.impressora = impressora;
        this.status = "NAO_LIDA";
        }catch(erro){
            console.log(erro);
        }
        return this;
    }

    comparar_mensagem(obj_mensagem) {
        if((obj_mensagem.impressora.status === this.impressora.status)) {
           console.log('mensagens iguais, não adiciona') ;
           return false;
        }else if((obj_mensagem.impressora.status !== this.impressora.status)) {
            console.Console.log('mensagens diferentes, adicione a lista') ;
            return true;
        }
    }


}
export {Mensagem};