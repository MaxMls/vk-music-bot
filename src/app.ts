import dotenv from "dotenv";
import {VKApi, ConsoleLogger, BotsLongPollUpdatesProvider} from 'node-vk-sdk'
import MessageNew from "./handlers/message_new";
import http from "http";

dotenv.config()


let api = new VKApi({
	token: process.env.TOKEN,
	logger: new ConsoleLogger(),
})

let updatesProvider = new BotsLongPollUpdatesProvider(api, +process.env.GROUP_ID)

updatesProvider.getUpdates((updates: Array<any>) => {

	//console.log('got updates: ', JSON.stringify(updates, null, 2))
	try {
		updates.forEach((item) => ({
			message_new: MessageNew
		}[item.type]?.(item.object, api)))
	} catch (e) {
		api.messagesSend({
			random_id: (Math.random() * 1000000000) | 0,
			user_id:  +process.env.ADMIN_ID,
			message: JSON.stringify(e, null, 1)
		})
	}
})


const requestListener = function (req, res) {
	res.writeHead(200);

	api.messagesGetLongPollHistory({}).then(console.log)

	res.end('Hello, World!');
}

const server = http.createServer(requestListener);
server.listen(8080);
