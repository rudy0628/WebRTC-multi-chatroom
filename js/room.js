/////////////////////// UI DOM manipulate ////////////////////////
let messagesContainer = document.getElementById('messages');
messagesContainer.scrollTop = messagesContainer.scrollHeight;

const memberContainer = document.getElementById('members__container');
const memberButton = document.getElementById('members__button');

const chatContainer = document.getElementById('messages__container');
const chatButton = document.getElementById('chat__button');

let activeMemberContainer = false;

memberButton.addEventListener('click', () => {
	if (activeMemberContainer) {
		memberContainer.style.display = 'none';
	} else {
		memberContainer.style.display = 'block';
	}

	activeMemberContainer = !activeMemberContainer;
});

let activeChatContainer = false;

chatButton.addEventListener('click', () => {
	if (activeChatContainer) {
		chatContainer.style.display = 'none';
	} else {
		chatContainer.style.display = 'block';
	}

	activeChatContainer = !activeChatContainer;
});

///////////////////////// video frame DOM /////////////////////////
let displayFrame = document.getElementById('stream__box');
let videoFrames = document.getElementsByClassName('video__container');
// which user is now in display frame
let userIdInDisplayFrame = null;

// expand display frame handler
let expandVideoFrame = e => {
	let child = displayFrame.children[0];
	if (child) {
		document.getElementById('streams__container').appendChild(child);
	}

	displayFrame.style.display = 'block';
	// Move click user video to video frame
	displayFrame.appendChild(e.currentTarget);
	// Set the current display frame user id
	userIdInDisplayFrame = e.currentTarget.id;

	// every video click, we want to let user video circle to be smaller, except for display frame.
	for (const videoFrame of videoFrames) {
		if (videoFrame.id !== userIdInDisplayFrame) {
			videoFrame.style.height = '100px';
			videoFrame.style.width = '100px';
		}
	}
};

for (const videoFrame of videoFrames) {
	videoFrame.addEventListener('click', expandVideoFrame);
}

let hideDisplayFrame = () => {
	userIdInDisplayFrame = null;
	displayFrame.style.display = 'none';

	let child = displayFrame.children[0];
	document.getElementById('streams__container').appendChild(child);

	for (const videoFrame of videoFrames) {
		videoFrame.style.width = '300px';
		videoFrame.style.height = '300px';
	}
};

// click display frame to hide.
displayFrame.addEventListener('click', hideDisplayFrame);
