import {VKApi} from "node-vk-sdk";

export default function MessageNew(body: any, api: VKApi) {

	const messages = []

	function extract(message) {
		if (Array.isArray(message?.fwd_messages)) {
			message?.fwd_messages.map(extract)
		}
		if (message?.reply_message) {
			extract(message?.reply_message)
		}
		if (Array.isArray(message?.attachments)) {
			message?.attachments.forEach(({type, ...attachment}) => {
				if (type === "audio") {
					const {audio: {artist, title, url}} = attachment
					messages.push(`${artist} - ${title}\n${url || 'Похоже ссылка для этой аудиозаписи недоступна'}`)
				} else if (type === "audio_message") {
					const {audio_message: {link_mp3, link_ogg}} = attachment
					messages.push(`Голосовое Сообщение\n${link_mp3 || 'Похоже ссылка для этого голосового сообщения недоступна'}`)
				}
			})
		}
	}

	extract(body.message)

	api.messagesSend({
		message: messages.join(`\n\n`) || 'Прости, я понимаю только музыку',
		user_id: body.message.from_id,
		random_id: (Math.random() * 1000000000) | 0,
		dont_parse_links: true
	})

}
