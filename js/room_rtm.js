///////////////////////// participant list ////////////////////
const handleMemberJoined = async MemberId => {
	addMemberToDOM(MemberId);

	let members = await channel.getMembers();
	updateMemberTotal(members);

	// Welcome bot message
	// prettier-ignore
	let { name } = await rtmClient.getUserAttributesByKeys(MemberId, ['name']);
	addBotMessageToDOM(`Welcome to the room! ${name} 👋`);
};

// Add member to DOM(participants list DOM)
const addMemberToDOM = async MemberId => {
	// prettier-ignore
	let { name } = await rtmClient.getUserAttributesByKeys(MemberId, ['name']);

	let membersWrapper = document.getElementById('member__list');
	let memberItem = `<div class="member__wrapper" id="member__${MemberId}__wrapper">
                      <span class="green__icon"></span>
                      <p class="member_name">${name}</p>
                    </div>`;

	membersWrapper.insertAdjacentHTML('beforeend', memberItem);
};

const handleMemberLeft = async MemberId => {
	removeMemberFromDOM(MemberId);

	let members = await channel.getMembers();
	updateMemberTotal(members);
};

const removeMemberFromDOM = async MemberId => {
	let memberWrapper = document.getElementById(`member__${MemberId}__wrapper`);
	let name = memberWrapper.getElementsByClassName('member_name')[0].textContent;
	addBotMessageToDOM(`${name} has left the room!`);

	memberWrapper.remove();
};

const getMembers = async () => {
	let members = await channel.getMembers();

	updateMemberTotal(members);

	for (const member of members) {
		addMemberToDOM(member);
	}
};

const updateMemberTotal = async members => {
	let total = document.getElementById('members__count');
	total.innerText = members.length;
};

///////////////////////// chatroom message ////////////////////
const addMessageToDOM = (name, message) => {
	const messagesWrapper = document.getElementById('messages');
	const newMessage = `<div class="message__wrapper">
                        <div class="message__body">
                            <strong class="message__author">${name}</strong>
                            <p class="message__text">${message}</p>
                        </div>
                      </div>`;
	messagesWrapper.insertAdjacentHTML('beforeend', newMessage);

	let lastMessage = document.querySelector(
		'#messages .message__wrapper:last-child'
	);
	if (lastMessage) {
		lastMessage.scrollIntoView();
	}
};

const addBotMessageToDOM = botMessage => {
	const messagesWrapper = document.getElementById('messages');
	const newMessage = `<div class="message__wrapper">
                        <div class="message__body__bot">
                            <strong class="message__author__bot">🤖 Mumble Bot</strong>
                            <p class="message__text__bot">${botMessage}</p>
                        </div>
                      </div>`;
	messagesWrapper.insertAdjacentHTML('beforeend', newMessage);

	let lastMessage = document.querySelector(
		'#messages .message__wrapper:last-child'
	);
	if (lastMessage) {
		lastMessage.scrollIntoView();
	}
};

const sendMessage = async e => {
	e.preventDefault();

	let message = e.target.message.value;
	channel.sendMessage({
		text: JSON.stringify({
			type: 'chat',
			message: message,
			displayName: displayName,
		}),
	});

	addMessageToDOM(displayName, message);

	e.target.reset();
};

const handleChannelMessage = async (messageData, MemberId) => {
	let data = JSON.parse(messageData.text);

	if (data.type === 'chat') {
		addMessageToDOM(data.displayName, data.message);
	}

	if (data.type === 'user_left') {
		document.getElementById(`user-container-${data.uid}`).remove();
	}
};

// leave channel function
const leaveChannel = async () => {
	await channel.leave();
	await rtmClient.logout();
};

window.addEventListener('beforeunload', leaveChannel);
document
	.getElementById('message__form')
	.addEventListener('submit', sendMessage);
