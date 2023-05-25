/// session = { sessionID:"", username:"", status:"active", deleteTimeout... }
class SessionStore {/*{{{2*/
	constructor() {
		this.session = new Map();
		this.__sesionTimeout = 60000;
	}
	__sessionTimeout;
	findSession(id) {
		if(typeof id === "object" && typeof id.sessionID == "string") {
			return this.session.get(id.sessionID);
		}
		return this.session.get(id);
	}
	findSessionByUsername(username) {
		const _AllSessions = this.getAllSessions();
		for( session of _AllSessions ) {
			if(session.username == username) {
				return session;
			}
		}
		return null;
	}
	saveSession(id, session) {
		//saveSession might change the reference so use updateSession
		//instead to update an existing session
		if(arguments.length == 1) {
			this.session.set(id.sessionID, id);
		}
		this.session.set(id, session);
	}
	deleteSession(id) {
		if(typeof id === "object" && typeof id.sessionID == "string") {
			return this.session.delete(id.sessionID);
		}
		return this.session.delete(id);
	}
	getAllSessions() {
		return [...this.session.values()];
	}
	getAllUsernames() {
		const _AllSessions = this.getAllSessions();
		const _AllUsernames = [];
		for( let session of _AllSessions ) {
			_AllUsernames.push(session.username);
		}
		_AllUsernames.sort();
		return _AllUsernames;
	}
}
module.exports = SessionStore;
