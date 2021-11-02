const fetch    = require('node-fetch');
const cheerio  = require('cheerio');
const utils    = require('./utils');
const db_utils = require('./db_utils');

const sed = async (chat, text, reply, reply_to_message) => {
	const commands = text.split(';');
	reply.text     = reply.text.replace(/You mean:\n/g, '');
	let answer     = reply.text;
	commands.forEach(command => {
		const splitted = command.split('/');
		if (!splitted[3]) splitted.push('');
		splitted[3] = splitted[3].replace(/[^gimsuy]/g, '');
		try {
			const rx = new RegExp(splitted[1], splitted[3]);
			answer   = answer.replace(rx, splitted[2]);
		} catch (e) { console.log(e); }
	});
	answer         = '*You mean:*\n' + answer;
	const reply_to = reply_to_message.message_id;
	await utils.send_message(parseInt(chat.id), answer, parseInt(reply_to));
};

const roll = async (chat, text, message_id, username) => {
	const toRoll = text.split(' ')[1];
	if (!toRoll) return;
	const reg = /(\d+)d(\d+)([\+-]\d+)?/;
	const res = toRoll.match(reg);
	if (!res) return;
	if (res.length < 3) return;
	var answer = username + ' rolls [';
	var sum    = 0;
	for (let i = 0; i < res[1]; ++i) {
		const buf = Math.floor(Math.random() * res[2] + 1);
		answer += ' ' + buf + ',';
		sum += buf;
	}
	answer = answer.replace(/,$/, ' ');
	answer += '] = ' + sum;
	await utils.send_message(parseInt(chat.id), answer, parseInt(message_id),
	                         true);
};

const ud = async (chat, text, reply_to) => {
	text = text.replace('/ud ', '').replace(' ', '+');

	let answer = '';

	try {
		const res =
		  await fetch(`https://www.urbandictionary.com/define.php?term=${text}`);
		const $          = cheerio.load(await res.text());
		const word       = $('.word').first().text();
		const definition = $('.meaning').first().text();
		const example    = $('.example').first().text();

		if (word !== '') {
			answer = `${word} definition: ${definition}\n\nExample: ${example}`;
		} else {
			answer = 'No definition found';
		}
	} catch (error) { answer = 'An unexpected error has occurred'; }

	await utils.send_message(parseInt(chat.id), answer, parseInt(reply_to), true);
};

const kym = async (chat, text, reply_to) => {
	text = text.replace('/kym ', '').replace(' ', '+');

	let answer = '';

	try {
		let res = await fetch(`https://knowyourmeme.com/search?q=${text}`);
		let             $ = cheerio.load(await res.text());
		const router      = $('.entry_list a').first().attr('href');

		res              = await fetch(`https://knowyourmeme.com${router}`);
		$                = cheerio.load(await res.text());
		const definition = $('.bodycopy p').first().text();

		if (definition !== 'About') {
			answer = definition;
		} else {
			answer = $('.bodycopy p').next().text();
		}
	} catch (error) { answer = 'No meme found'; }

	await utils.send_message(parseInt(chat.id), answer, parseInt(reply_to), true);
};

const quote = async (chat, text, reply_to) => {
	let answer     = '';
	const quote_id = Number(text.split(' ')[1]) || -1;
	if (quote_id === -1) return;
	answer = await db_utils.get_quote(quote_id).catch(console.error);
	if (answer === -1) answer = 'Couldn\'t found that quote ( _ _)';
	await utils.send_message(parseInt(chat.id), answer, parseInt(reply_to), true);
};

const addquote = async (chat, text, reply, reply_to) => {
	const quote_text = reply ? reply.text : text.replace('/addquote', '');
	const quote_id   = await db_utils.insert_quote(quote_text);
	const answer     = `Quote #${quote_id} added!\n${quote_text}`;

	await utils.send_message(parseInt(chat.id), answer, parseInt(reply_to), true);
};

module.exports = {
	sed,
	roll,
	ud,
	kym,
	quote,
	addquote
};