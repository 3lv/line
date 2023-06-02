class EventStore() {
	constructor() {
		this.events = [];
	}
	saveEvent(event) {
		events.push(event);
	}
};
/*
		event = {
			rooms: [],
			name: "global-message",
			args: [{
				username: socket.session.username,
				text:     message.text,
				image:    "" }],
			date: new Date()
		};
		eventStore.saveEvent(event);
*/
