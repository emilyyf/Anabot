const fetch   = require('node-fetch');
const process = require('process');

const api_url = 'https://api.telegram.org/bot' + process.env.BOT_TOKEN;

const send_message = async (id, data, id_reply, do_not_parse) => {
	return await fetch(api_url + '/sendMessage', {
		       method : 'POST',
		       headers : { 'Content-Type' : 'application/json' },
		       body : JSON.stringify({
			       chat_id : id,
			       text : data,
			       reply_to_message_id : id_reply,
			       parse_mode : do_not_parse ? undefined : 'Markdown'
		       })
	       })
	  .then(res => console.log(res.json()));
};

module.exports = { send_message };