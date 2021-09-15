const fetch = require('node-fetch');

const api_url = 'https://api.telegram.org/bot' + process.env.BOT_TOKEN;

const send_message = async (id, data, id_reply) => {
	return await fetch(api_url + '/sendMessage', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: id,
			text: data,
			reply_to_message_id: id_reply,
			parse_mode: 'Markdown'
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

module.exports = async (req, res) => {
	if (!req.body) {
		res.status(200).send('Ok');
		return;
	}

	const { message } = req.body; 

	console.log(message);
	if (!message) {
		console.log(req.body);
		res.status(200).send('Ok');
		return;
	}

	const { chat, text } = message;
	const { reply_to_message, message_id } = message;
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

	res.status(200).send('Ok');
};