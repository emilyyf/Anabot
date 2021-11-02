const db_utils = require('./db_utils');
const utils    = require('./utils');
const commands = require('./commands');

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

	const { chat, text, from }             = message;
	const { reply_to_message, message_id } = message;
	const { username }                     = from;
	const reply_to =
	  (reply_to_message) ? reply_to_message.message_id : message_id;
	const reply = (reply_to_message) ? reply_to_message.from : undefined;
	if (reply) reply.text = reply_to_message.text;
	if (reply) reply.date = reply_to_message.date;

	if (message.dice && message.dice.value && message.dice.value == 1) {
		await utils.send_message(parseInt(chat.id), 'Noob', parseInt(message_id));
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
		await commands.sed(chat, text, reply, reply_to_message);
	}

	await db_utils.connectToDB();

	if (text.startsWith('/roll')) {
		await commands.roll(chat, text, message_id, username);
	}

	if (text.startsWith('/ud')) { await commands.ud(chat, text, reply_to); }

	if (text.startsWith('/kym')) { await commands.kym(chat, text, reply_to); }

	if (text.startsWith('/quote')) { await commands.quote(chat, text, reply_to); }

	if (text.startsWith('/addquote')) {
		await commands.addquote(chat, text, reply, reply_to);
	}

	res.status(200).send('Ok');
};