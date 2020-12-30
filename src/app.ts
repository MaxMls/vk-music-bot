import dotenv from "dotenv";
import {VKApi, ConsoleLogger, BotsLongPollUpdatesProvider} from 'node-vk-sdk'
import MessageNew from "./handlers/message_new";
import http from "http";

dotenv.config()


let api = new VKApi({
	token: process.env.TOKEN,
	logger: new ConsoleLogger()
})

let updatesProvider = new BotsLongPollUpdatesProvider(api, +process.env.GROUP_ID)

updatesProvider.getUpdates((updates: Array<any>) => {

	console.log('got updates: ', JSON.stringify(updates, null, 2))

	updates.forEach((item) => ({
		message_new: MessageNew
	}[item.type]?.(item.object, api)))
})


const requestListener = function (req, res) {
	res.writeHead(200);
	res.end('Hello, World!');
}

const server = http.createServer(requestListener);
server.listen(8080);
