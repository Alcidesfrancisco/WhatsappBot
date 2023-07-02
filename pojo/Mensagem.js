
class Mensagem{
    constructor(texto, impressora){
        this.texto = texto;
        this.impressora = impressora;
    }
    get_numero(){ return this.numero;}
    get_texto(){ return this.texto}
    set_texto(texto){this.texto = texto}
    get_impressora(){ return this.impressora}

    compor_mensagem(mensagem_zap){
        
        let linhas = mensagem_zap.split("\n");
        this.texto = linhas.shift();

        let impressora = new Impressora();
        impressora.marca = linhas.shift()[1];
        impressora.modelo = linhas.shift()[1];
        impressora.serial = linhas.shift()[1];
        impressora.ip = linhas.shift()[1];
        impressora.nivel_toner = linhas.shift()[1];
        impressora.serial = linhas.shift()[1];
        impressora.paginas = linhas.shift()[1];
        this.impressora = impressora;
        return this;
    }
}