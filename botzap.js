
import web from 'whatsapp-web.js';
const  { Client, LocalAuth, MessageMedia } = web;
import express  from 'express';
//const express = require('express');
import  { body, validationResult }  from 'express-validator';
import socketIO from 'socket.io';
import qrcode from 'qrcode';
import http from 'http';
import fileUpload from 'express-fileupload';
import axios from 'axios';
import mime from 'mime-types';
const port =  process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const io =  socketIO(server);
import { Printer } from './model/Printer.js';

import path from 'path';
import { fileURLToPath } from 'url';

import {Mensagem} from './model/Mensagem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// app.use(express.json({limit: '50mb'}));
// app.use(express.urlencoded({limit: '50mb'}));

app.use(express.json());
app.use(express.urlencoded({
extended: true
}));
app.use(fileUpload({
debug: false //mudei para false
}));
app.use("/", express.static(__dirname + "/"))

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'bot-zap' }),
  puppeteer: { headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ] }
});

client.initialize();

io.on('connection', function(socket) {
  socket.emit('message', 'Bot zap - Iniciado');
  socket.emit('qr', './images/icon.ico');

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', 'Bot zap  - QRCode recebido, aponte a câmera  do seu celular!');
    });
});

client.on('ready', () => {
    socket.emit('ready', ' Bot zap - Dispositivo pronto!');
    socket.emit('message', ' Bot zap - Dispositivo pronto!');
    socket.emit('qr', './check.svg')	
    console.log(' Bot zap Dispositivo pronto');
});

client.on('authenticated', () => {
    socket.emit('authenticated', ' Bot zap Autenticado!');
    socket.emit('message', ' Bot zap Autenticado!');
    console.log(' Bot zap Autenticado');
});

client.on('auth_failure', function() {
    socket.emit('message', ' Bot zap - Falha na autenticação, reiniciando...');
    console.error(' Bot zap Falha na autenticação');
});

client.on('change_state', state => {
  console.log(' Bot zap - Status de conexão: ', state );
});

client.on('disconnected', (reason) => {
  socket.emit('message', ' Bot zap - Cliente desconectado!');
  console.log(' Bot zap Cliente desconectado', reason);
  client.initialize();
});
});

var mensagens = [];

app.get('/zap-bot-get_messages', async (req, res) => {  

  res.send(mensagens)
  console.log('zap-bot-get XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
})

app.post('/zap-bot-printer', async (req, res) =>{
//   var p = req.body["name"];
// console.log(p);

});

// Send message
app.post('/zap-bot-message', [
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  console.log("mensagem enviada para "  , req.body.number);
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }
  
  const number = req.body.number;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  const message = req.body.message;

  filtrar_mensagens(req);
  //var p = Printer(message);
  //console.log(message);

  if (numberDDI !== "55") {
    const numberZAP = number + "@c.us";
    client.sendMessage(numberZAP, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'Bot zap - Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'Bot zap - Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberZAP = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberZAP, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'Bot zap - Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'Bot zap - Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberZAP = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberZAP, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'Bot zap - Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'Bot zap - Mensagem não enviada',
      response: err.text
    });
    });
  }
});

// Send media
app.post('/zap-media', [
  body('number').notEmpty(),
  body('caption').notEmpty(),
  body('file').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  const caption = req.body.caption;
  const fileUrl = req.body.file;

  let mimetype;
  const attachment = await axios.get(fileUrl, {
    responseType: 'arraybuffer'
  }).then(response => {
    mimetype = response.headers['content-type'];
    return response.data.toString('base64');
  });

  const media = new MessageMedia(mimetype, attachment, 'Media');

  if (numberDDI !== "55") {
    const numberZAP = number + "@c.us";
    client.sendMessage(numberZAP, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'Bot zap - Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'Bot zap - Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberZAP = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberZAP, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'Bot zap - Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'Bot zap - Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberZAP = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberZAP, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'Bot zap Imagem - enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'Bot zap - Imagem não enviada',
      response: err.text
    });
    });
  }
});

client.on('message', async msg => {
var respostas = [];
  if (msg.body !== null && msg.body.toString().toUpperCase() === "OK") {
    respostas.push("OK");
    for (let index = 0; index < mensagens.length; index++) {
      mensagens[index].status = "LIDA";      
    }
    console.log(mensagens);
    const contact = await msg.getContact();
    msg.reply(`Recebido a confirmação de envio de suprimento para a impressora\n  ${contact.pushname} ", deseja informar data prevista para o envio do Suprimento de impressão?\n S-[Sim]  N-[Não]`);
    
  } 
  
  else if (msg.body !== null && (msg.body.toString().toUpperCase() == "SIM" || msg.body.toString().toUpperCase() == "S")) {
    
    msg.reply("Informe a Data de prevista para envio do suprimento");
    respostas = [];

  }
  
  else if (msg.body !== null && (msg.body.toString().toUpperCase() == "NÃO" || msg.body.toString().toUpperCase() == "N" || msg.body !== null && msg.body.toString().toUpperCase() === "NAO") && "OK" === respostas.at[-1]) {
    msg.reply("Obrigado por atender nossas demandas! até a próxima!!");
    respostas = [];
  }
  
  else if (msg.body !== null && msg.body === "4") {

        const contact = await msg.getContact();
        setTimeout(function() {
            msg.reply(`@${contact.number}` + ' seu contato já foi encaminhado para o O NATI');  
            client.sendMessage('558197143365@c.us','Contato ZAP. https://wa.me/' + `${contact.number}`);
          },1000 + Math.floor(Math.random() * 1000));
  
  }
  
  else if (msg.body !== null && msg.body === "4") {
    msg.reply("");
  }
  
  else if (msg.body !== null && msg.body === "5") {
    msg.reply("");
  }
  
  else if (msg.body !== null && msg.body === "7") {
    msg.reply("");
  }
  
  else if (msg.body !== null && msg.body === "8") {
    msg.reply("");
  } 
  
  else if (msg.body !== null && msg.body === "9") {
    msg.reply("");
  }
  
  else if (msg.body !== null && msg.body === "10") {
    msg.reply("");
  }
  
  else if (msg.body !== null && msg.body === "11") {

        const contact = await msg.getContact();
        setTimeout(function() {
            msg.reply(`@${contact.number}` + ' your contact has already been forwarded');  
            client.sendMessage('5581971433652@c.us','Contato ZAP - EN. https://wa.me/' + `${contact.number}`);
          },1000 + Math.floor(Math.random() * 1000));
  
  }
  else if (msg.body !== null && msg.body === "18") {

        const contact = await msg.getContact();
        setTimeout(function() {
            msg.reply(`@${contact.number}` + ' su contacto ya ha sido reenviado a Pedrinho');  
            client.sendMessage('558197143365@c.us','Contato ZAP. https://wa.me/' + `${contact.number}`);
          },1000 + Math.floor(Math.random() * 1000));
  
  }
  
  else if (msg.body !== null && msg.body === "18") {
    msg.reply("");
  }
  
  else if (msg.body !== null && msg.body === "19") {
    msg.reply("");
  }

  else if (msg.body !== null && msg.body === "6"){
	  msg.reply("");
  }

	else if (msg.body !== null && msg.body === "13"){
		msg.reply("");
	}

  else if (msg.body !== null && msg.body === "20"){
		msg.reply("");
	}

	else if (msg.body !== null || msg.body === "0" || msg.type !== 'ciphertext') {
    
    msg.reply("opção inválida! XXXX" + msg.body);
	}
});

    
server.listen(port, function() {
        console.log('App running on *: ' + port);
});


function filtrar_mensagens(req) {
  console.log('Filtrar');
  console.log(req.headers);
  console.log(req.headers['tipo_mensagem']);
  let tipo_mensagem = req.headers['tipo_mensagem'];

  //só passa se for mnsagem do tipo toner
  if(tipo_mensagem === "toner"){
    try{
      var mensagem = new Mensagem().compor_mensagem(req.body.message);
      var adicionou = false;
      var repetido = false;
      if (mensagens.length > 0) {

        mensagens.forEach(element => {
          if (mensagem.impressora.serial === element.impressora.serial) {
            if (mensagem.comparar_mensagem(element)) {
              mensagens.push(element); // serial igual e status diferente, adiciona
              adicionou = true;
              console.log("adicionou");
            } else {
              repetido = true;
              console.log("repetido");
            }

          }
        });
        if (!repetido && !adicionou) {
          mensagens.push(mensagem);
          console.log("novo");
        }
      } else {
        mensagens.push(mensagem);
        adicionou = true;
      }
      var adicionou = false;
      var repetido = false;
    }catch(e){
    console.log(e);
    }
    console.log(mensagens.length);
    console.log(mensagens);
}
}

