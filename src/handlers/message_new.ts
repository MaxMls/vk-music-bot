import {VKApi} from "node-vk-sdk";
import {MessagesMessage, VideoVideo} from "node-vk-sdk/distr/src/generated/Models";

function print(v) {
	console.log(JSON.stringify(v, null, 1))
}


export default async function MessageNew(body: any, api: VKApi) {
	let message = body.message as MessagesMessage


	if (message.is_cropped) message = (await api.messagesGetById({message_ids: [message.id],})).items[0]

	function extract(message, messages: any[] = []) {

		if (Array.isArray(message?.fwd_messages)) {
			message?.fwd_messages.map((v) => extract(v, messages))
		}
		if (message?.reply_message) {
			extract(message?.reply_message, messages)
		}
		if (Array.isArray(message?.attachments)) {
			message?.attachments?.forEach(({type, ...attachment}) => {
				if (type === "audio") {
					const {audio: {artist, title, url}} = attachment
					messages.push(`${artist} - ${title}\n${url || 'Похоже ссылка для этой аудиозаписи недоступна'}`)
				} else if (type === "audio_message") {
					const {audio_message: {link_mp3, link_ogg}} = attachment
					messages.push(`Голосовое сообщение\n${link_mp3 || 'Похоже ссылка для этого голосового сообщения недоступна'}`)
				} else if (type === "video") {
					const {video: {owner_id, id, access_key, title}} = attachment
					messages.push({type, id: [owner_id, id, access_key].join('_'), title})
				}
			})
		}
		return messages
	}

	const messages = extract(message)

	const videos = messages.reduce((previousValue: any[], currentValue, messageIndex) => {
		if (currentValue?.type === 'video')
			previousValue.push({...currentValue, messageIndex})
		return previousValue
	}, [])


	if (videos?.length) {
		await api.videoGet({
			access_token: process.env.ADMIN_TOKEN,
			videos: videos.map(({id}) => id),
		}).then((v) => {
			videos.forEach(({messageIndex}, i) => {
				// @ts-ignore
				const {files, title}: VideoVideo = v.items[i]
				const links = Object.entries(files)

				messages[messageIndex] = `${title}\n${links.length ? links.map(([format, link]) => `${format}: ${link}`).join('\n') : 'Похоже ссылка для этого видео недоступна'}`
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

	} catch (e){
		if(e?.errorCode === 914){
			for (let text of messages){
				await api.messagesSend({
					message: text,
					user_id: message.from_id,
					random_id: (Math.random() * 1000000000) | 0,
					dont_parse_links: true
				})
			}
		}
	}



}
