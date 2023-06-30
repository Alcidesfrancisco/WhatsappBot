const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const mime = require('mime-types');
const port = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({
extended: true
}));
app.use(fileUpload({
debug: true
}));
app.use("/", express.static(__dirname + "/"))

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'bot-zdg' }),
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
  socket.emit('message', '© BOT-ZDG - Iniciado');
  socket.emit('qr', './icon.svg');

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', '© BOT-ZDG QRCode recebido, aponte a câmera  seu celular!');
    });
});

client.on('ready', () => {
    socket.emit('ready', '© BOT-ZDG Dispositivo pronto!');
    socket.emit('message', '© BOT-ZDG Dispositivo pronto!');
    socket.emit('qr', './check.svg')	
    console.log('© BOT-ZDG Dispositivo pronto');
});

client.on('authenticated', () => {
    socket.emit('authenticated', '© BOT-ZDG Autenticado!');
    socket.emit('message', '© BOT-ZDG Autenticado!');
    console.log('© BOT-ZDG Autenticado');
});

client.on('auth_failure', function() {
    socket.emit('message', '© BOT-ZDG Falha na autenticação, reiniciando...');
    console.error('© BOT-ZDG Falha na autenticação');
});

client.on('change_state', state => {
  console.log('© BOT-ZDG Status de conexão: ', state );
});

client.on('disconnected', (reason) => {
  socket.emit('message', '© BOT-ZDG Cliente desconectado!');
  console.log('© BOT-ZDG Cliente desconectado', reason);
  client.initialize();
});
});

// Send message
app.post('/zdg-message', [
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  console.log("teste", req.body.number);
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

  if (numberDDI !== "55") {
    const numberZDG = number + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberZDG = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Mensagem não enviada',
      response: err.text
    });
    });
  }
});


// Send media
app.post('/zdg-media', [
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
    const numberZDG = number + "@c.us";
    client.sendMessage(numberZDG, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberZDG, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberZDG = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberZDG, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Imagem não enviada',
      response: err.text
    });
    });
  }
});

client.on('message', async msg => {

  if (msg.body !== null && msg.body === "1") {
    msg.reply("");
  } 
  
  else if (msg.body !== null && msg.body === "2") {
    msg.reply("");
  }
  
  else if (msg.body !== null && msg.body === "3") {
    msg.reply("");
  }
  
  else if (msg.body !== null && msg.body === "4") {

        const contact = await msg.getContact();
        setTimeout(function() {
            msg.reply(`@${contact.number}` + ' seu contato já foi encaminhado para o Pedrinho');  
            client.sendMessage('5515998566622@c.us','Contato ZDG. https://wa.me/' + `${contact.number}`);
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
            client.sendMessage('5515998566622@c.us','Contato ZDG - EN. https://wa.me/' + `${contact.number}`);
          },1000 + Math.floor(Math.random() * 1000));
  
  }
  
  else if (msg.body !== null && msg.body === "11") {
    msg.reply("");
  }
  
  else if (msg.body !== null && msg.body === "12") {
    msg.reply("");
  }
  
  else if (msg.body !== null && msg.body === "14") {
    msg.reply("");
  }
  
  else if (msg.body !== null && msg.body === "15") {
    msg.reply("");
  } 
  
  else if (msg.body !== null && msg.body === "16") {
    msg.reply("");
  }
  
  else if (msg.body !== null && msg.body === "17") {
    msg.reply("");
  }
  
  else if (msg.body !== null && msg.body === "18") {

        const contact = await msg.getContact();
        setTimeout(function() {
            msg.reply(`@${contact.number}` + ' su contacto ya ha sido reenviado a Pedrinho');  
            client.sendMessage('5515998566622@c.us','Contato ZDG - ES. https://wa.me/' + `${contact.number}`);
          },1000 + Math.floor(Math.random() * 1000));
  
  }
  
  else if (msg.body !== null && msg.body === "18") {
    msg.reply("Su contacto ya ha sido reenviado a Pedrinho");
  }
  
  else if (msg.body !== null && msg.body === "19") {
    msg.reply("Disfruta del contenido y aprende en unos minutos cómo poner en línea tu API de WhatsAPP, gratis:\r\n\r\n🎥 https://youtu.be/899mKB3UHdI");
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
    //msg.reply("Testando umas paradas aqui ignore essas mensagens automáticas");
	}
});

    
server.listen(port, function() {
        console.log('App running on *: ' + port);
});
