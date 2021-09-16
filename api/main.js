const fetch = require('node-fetch');
const cheerio = require('cheerio');

const api_url = 'https://api.telegram.org/bot' + process.env.BOT_TOKEN;

const send_message = async (id, data, id_reply, do_not_parse) => {
	return await fetch(api_url + '/sendMessage', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: id,
			text: data,
			reply_to_message_id: id_reply,
			parse_mode: do_not_parse ? undefined : 'Markdown'
		})
	})
		.then(res => console.log(res.json()));
}

const sed = async (chat, text, reply, reply_to_message) => {
	const commands = text.split(';');
	reply.text = reply.text.replace(/You mean:\n/g, '');
	let answer = reply.text;
	commands.forEach(command => {
		const splitted = command.split('/');
		if (!splitted[3]) splitted.push('');
		splitted[3] = splitted[3].replace(/[^gimsuy]/g, '');
		try {
			const rx = new RegExp(splitted[1], splitted[3]);
			answer = answer.replace(rx, splitted[2]);
		} catch (e) { console.log(e); }
	});
	answer = '*You mean:*\n' + answer;
	const reply_to = reply_to_message.message_id;
	await send_message(parseInt(chat.id), answer, parseInt(reply_to));
}

const roll = async (chat, text, message_id, username) => {
	const toRoll = text.split(' ')[1];
	if (!toRoll) return;
	const reg = /(\d+)d(\d+)([\+-]\d+)?/;
	const res = toRoll.match(reg);
	if (!res) return;
	if (res.length < 3) return;
	var answer = username + ' rolls [';
	var sum = 0;
	for (i = 0; i < res[1]; ++i) {
		const buf = Math.floor(Math.random() * res[2] + 1);
		answer += ' ' + buf + ',';
		sum+=buf;
	}
	answer = answer.replace(/,$/, ' ');
	answer += '] = ' + sum;
	await send_message(parseInt(chat.id), answer, parseInt(message_id), true);
}

const ud = async (chat, text, reply_to) => {
    text = text.replace('/ud ', '').replace(' ', '+');

	let answer = '';

	try {
		const res = await fetch(`https://www.urbandictionary.com/define.php?term=${text}`);
		const $ = cheerio.load(await res.text());
		const word = $('.word').first().text();
		const definition = $('.meaning').first().text();
		const example = $('.example').first().text();
	
		if (word !== '') {
			answer = `${word} definition: ${definition}\n\nExample: ${example}`;
		} else {
			answer = 'No definition found';
		}
	} catch (error) {
		answer = 'An unexpected error has occurred'
	}

    await send_message(parseInt(chat.id), answer, parseInt(reply_to), true);
};

module.exports = async (req, res) => {
	if (!req.body) {
		res.status(200).send('Ok');
		return;
	}

	const { message } = req.body; 

	if (!message) {
		res.status(200).send('Ok');
		return;
	}

	const { chat, text, from } = message;
	const { reply_to_message, message_id } = message;
	const { username } = from;
	const reply_to = (reply_to_message) ? reply_to_message.message_id : message_id;
	const reply = (reply_to_message) ? reply_to_message.from : undefined;
	if (reply) reply.text = reply_to_message.text;
	if (reply) reply.date = reply_to_message.date;

	if (message.dice && message.dice.value && message.dice.value == 1) {
		await send_message(parseInt(chat.id), 'Noob', parseInt(message_id));
		res.status(200).send('Ok');
		return;
	}

	if (!text) {
		res.status(200).send('Ok');
		return;
	}

	if (!text.match('^s?\/[a-z]?')) {
		res.status(200).send('Ok');
		return;
	}

	if (text.startsWith('s/') && reply_to_message) {
		await sed(chat, text, reply, reply_to_message);
	}

	if (text.startsWith('/roll')) {
		await roll(chat, text, message_id, username);
	}

	if (text.startsWith("/ud")) {
		await ud(chat, text, reply_to);
	}

	res.status(200).send('Ok');
};