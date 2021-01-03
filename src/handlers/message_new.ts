import {VKApi} from "node-vk-sdk";
import {MessagesMessage, VideoVideo} from "node-vk-sdk/distr/src/generated/Models";

function print(v) {
	console.log(JSON.stringify(v, null, 1))
}


export default async function MessageNew(body: any, api: VKApi) {
	let message = body.message as MessagesMessage

	message = (await api.messagesGetById({
		message_ids: [message.id],
	})).items[0]

	function extract(message, messages: any[] = [], videos: any[] = []) {

		if (Array.isArray(message?.fwd_messages)) {
			message?.fwd_messages.map((v) => extract(v, messages, videos))
		}
		if (message?.reply_message) {
			extract(message?.reply_message, messages, videos)
		}
		if (Array.isArray(message?.attachments)) {
			message?.attachments?.forEach(({type, ...attachment}) => {
				if (type === "wall") {
					extract(attachment?.wall, messages, videos)
				} else if (type === "audio") {
					const {audio: {artist, title, url}} = attachment
					messages.push(`${artist} - ${title}\n${url || 'Похоже ссылка для этой аудиозаписи недоступна'}`)
				} else if (type === "audio_message") {
					const {audio_message: {link_mp3, link_ogg}} = attachment
					messages.push(`Голосовое сообщение\n${link_mp3 || 'Похоже ссылка для этого голосового сообщения недоступна'}`)
				} else if (type === "video") {
					const {video: {owner_id, id, access_key, title}} = attachment
					videos.push({id: [owner_id, id, access_key].join('_'), title})
				}
			})
		}
		return [messages, videos]
	}

	const [messages, videos] = extract(message)


	if (videos?.length) {
		await api.videoGet({
			access_token: process.env.ADMIN_TOKEN,
			videos: videos.map(({id}) => id),
		}).then((v) => {
			// @ts-ignore
			v.items.forEach(({title, files}) => {
				const links = Object.entries(files)
				messages.push(`${title}\n${links.length ? links.map(([format, link]) => `${format}: ${link}`).join('\n') : 'Похоже ссылка для этого видео недоступна'}`)
			})
		})
	}

	try {
		await api.messagesSend({
			message: messages.join(`\n\n`) || 'Прости, сейчас я понимаю только голос, музыку и видео',
			user_id: message.from_id,
			random_id: (Math.random() * 1000000000) | 0,
			dont_parse_links: true
		})

	} catch (e) {
		if (e?.errorCode === 914) {
			for (let text of messages) {
				await api.messagesSend({
					message: text,
					user_id: message.from_id,
					random_id: (Math.random() * 1000000000) | 0,
					dont_parse_links: true
				})
			}
		} else {
			console.error(e)
		}
	}
}
