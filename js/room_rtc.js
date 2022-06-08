const APP_ID = AGORA_APP_ID;

let uid = sessionStorage.getItem('uid');
if (!uid) {
	uid = Math.floor(Math.random() * 10000).toString();
	sessionStorage.setItem('uid', uid);
}

let token = null;
let client;

let rtmClient;
let channel;

// get room id by url
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('room');

if (!roomId) {
	roomId = 'main';
}

let displayName = localStorage.getItem('display_name');
if (!displayName) {
	window.location = 'lobby.html';
}

// local user track(video and audio)
let localTracks = [];
// local user screen tracks(screen)
let localScreenTracks;
let sharingScreen = false;
// remote users list
let remoteUsers = {};

let joinRoomInit = async () => {
	/////////////////////// participants ///////////////////////
	// join the channel for real-time Participants
	rtmClient = await AgoraRTM.createInstance(APP_ID);
	await rtmClient.login({ uid, token });

	await rtmClient.addOrUpdateLocalUserAttributes({ name: displayName });

	// create a chatroom channel, room id as same as stream room id
	channel = await rtmClient.createChannel(roomId);
	await channel.join();

	// when member join this room.
	channel.on('MemberJoined', handleMemberJoined);

	// when member leave this room.
	channel.on('MemberLeft', handleMemberLeft);

	// when member send the message to chat room
	channel.on('ChannelMessage', handleChannelMessage);

	// when new user join this room, always get all participant list in this room.
	getMembers();

	// Welcome bot message
	addBotMessageToDOM(`Welcome to the room! ${displayName} 👋`);

	/////////////////////// stream ///////////////////////
	// create a client and let uid join this room
	client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
	await client.join(APP_ID, roomId, token, uid);

	// when user join
	// published holding all tracks in this channel
	client.on('user-published', handleUserPublished);

	// when user leave
	client.on('user-left', handlerUserLeft);
};

let joinStream = async () => {
	// show stream controller
	document.querySelector('.stream__actions').style.display = 'flex';
	document.getElementById('join-btn').style.display = 'none';

	// create a stream tracks
	localTracks = await AgoraRTC.createMicrophoneAndCameraTracks(
		{},
		{
			encodeConfig: {
				width: {
					min: 644,
					ideal: 1920,
					max: 1920,
				},
				height: {
					min: 480,
					ideal: 1080,
					max: 1080,
				},
			},
		}
	);

	// create a video dom element
	let player = `<div class="video__container" id="user-container-${uid}">
                  <div class="video-player" id="user-${uid}">
                  </div>
                </div>`;
	document
		.getElementById('streams__container')
		.insertAdjacentHTML('beforeend', player);
	// add the expand to video frame handler
	document
		.getElementById(`user-container-${uid}`)
		.addEventListener('click', expandVideoFrame);

	// play this video
	localTracks[1].play(`user-${uid}`);
	// localTracks[0].play();

	// add local tracks, this will trigger 'user-published' method(handleUserPublished)
	await client.publish([localTracks[0], localTracks[1]]);
};

let handleUserPublished = async (user, mediaType) => {
	// add remote user to local user remoteUser lists
	remoteUsers[user.uid] = user;

	// let local user subscribe remote user
	await client.subscribe(user, mediaType);

	// create a remote user video element
	let player = document.getElementById(`user-container-${user.uid}`);
	if (player === null) {
		player = `<div class="video__container" id="user-container-${user.uid}">
                <div class="video-player" id="user-${user.uid}">
                </div>
              </div>`;
		document
			.getElementById('streams__container')
			.insertAdjacentHTML('beforeend', player);
		// add the expand to video frame handler
		document
			.getElementById(`user-container-${user.uid}`)
			.addEventListener('click', expandVideoFrame);
	}

	// check display frame has user
	if (displayFrame.style.display) {
		// change the user who come in newly to small circle.
		player = document.getElementById(`user-container-${user.uid}`);
		player.style.height = '100px';
		player.style.width = '100px';
	}

	if (mediaType === 'video') {
		user.videoTrack.play(`user-${user.uid}`);
	}

	if (mediaType === 'audio') {
		// user.audioTrack.play();
	}
};

let handlerUserLeft = async user => {
	// remove the user from remote users list
	delete remoteUsers[user.uid];
	let item = document.getElementById(`user-container-${user.uid}`);
	if (item) {
		// remove user from dom
		document.getElementById(`user-container-${user.uid}`).remove();
	}

	// if remote user leave and remote user is on display frame
	if (userIdInDisplayFrame === `user-container-${user.uid}`) {
		// display frame hidden
		displayFrame.style.display = 'none';
		// set all video container circle to 300px width and height
		let videoFrames = document.getElementsByClassName('video__container');
		for (const videoFrame of videoFrames) {
			videoFrame.style.width = '300px';
			videoFrame.style.height = '300px';
		}
	}
};

let leaveStream = async e => {
	e.preventDefault();
	// hide stream controller
	document.querySelector('.stream__actions').style.display = 'none';
	document.getElementById('join-btn').style.display = 'block';

	for (let i = 0; i < localTracks; i++) {
		localTracks[i].stop();
		localTracks[i].close();
	}

	await client.unpublish([localTracks[0], localTracks[1]]);

	if (localScreenTracks) {
		await client.unpublish([localScreenTracks]);
	}

	document.getElementById(`user-container-${uid}`).remove();

	if (userIdInDisplayFrame === `user-container-${uid}`) {
		displayFrame.style.display = 'none';
		for (const videoFrame of videoFrames) {
			videoFrame.style.height = '300px';
			videoFrame.style.width = '300px';
		}
	}

	channel.sendMessage({
		text: JSON.stringify({ type: 'user_left', uid: uid }),
	});
};

////////////////// video controller //////////////////
let switchToCamera = async () => {
	// create a video
	let player = `<div class="video__container" id="user-container-${uid}">
                <div class="video-player" id="user-${uid}">
                </div>
              </div>`;

	// insert camera to display frame
	displayFrame.insertAdjacentHTML('beforeend', player);

	// set muted true to camera tracks(video and audio)
	await localTracks[0].setMuted(true);
	await localTracks[1].setMuted(true);

	// unable mic and screen button active
	document.getElementById('mic-btn').classList.remove('active');
	document.getElementById('screen-btn').classList.remove('active');

	// play local tracks camera video
	localTracks[1].play(`user-${uid}`);

	// only publish video, because audio already exist in published
	await client.publish([localTracks[1]]);
};

let toggleCamera = async e => {
	let button = e.currentTarget;

	if (localTracks[1].muted) {
		await localTracks[1].setMuted(false);
		button.classList.add('active');
	} else {
		await localTracks[1].setMuted(true);
		button.classList.remove('active');
	}
};

let toggleMic = async e => {
	let button = e.currentTarget;

	if (localTracks[0].muted) {
		await localTracks[0].setMuted(false);
		button.classList.add('active');
	} else {
		await localTracks[0].setMuted(true);
		button.classList.remove('active');
	}
};

let toggleScreen = async e => {
	let screenButton = e.currentTarget;
	let cameraButton = document.getElementById('camera-btn');

	if (!sharingScreen) {
		sharingScreen = true;

		// enable screen button and unable camera button
		screenButton.classList.add('active');
		cameraButton.classList.remove('active');
		cameraButton.style.display = 'none';

		// create local screen tracks
		localScreenTracks = await AgoraRTC.createScreenVideoTrack();

		// remove the current video tracks
		document.getElementById(`user-container-${uid}`).remove();
		// automatic show display frame
		displayFrame.style.display = 'block';

		// create a player for screen video frame
		let player = `<div class="video__container" id="user-container-${uid}">
                <div class="video-player" id="user-${uid}">
                </div>
              </div>`;
		// append on display frame
		displayFrame.insertAdjacentHTML('beforeend', player);
		// add video frame click event method expandVideoFrame
		document
			.getElementById(`user-container-${uid}`)
			.addEventListener('click', expandVideoFrame);

		// set current display frame id
		userIdInDisplayFrame = `user-container-${uid}`;

		// local screen tracks play
		localScreenTracks.play(`user-${uid}`);

		// unpublish camera video, publish screen video
		await client.unpublish([localTracks[1]]);
		await client.publish([localScreenTracks]);

		// set all video frame not in display frame width and height to 100px
		let videoFrames = document.getElementsByClassName('video__container');
		for (const videoFrame of videoFrames) {
			if (videoFrame.id !== userIdInDisplayFrame) {
				videoFrame.style.height = '100px';
				videoFrame.style.width = '100px';
			}
		}
	} else {
		sharingScreen = false;
		cameraButton.style.display = 'block';

		// remove screen video
		document.getElementById(`user-container-${uid}`).remove();
		// unpublish screen video
		await client.unpublish([localScreenTracks]);

		switchToCamera();
	}
};

document.getElementById('camera-btn').addEventListener('click', toggleCamera);
document.getElementById('mic-btn').addEventListener('click', toggleMic);
document.getElementById('screen-btn').addEventListener('click', toggleScreen);
document.getElementById('join-btn').addEventListener('click', joinStream);
document.getElementById('leave-btn').addEventListener('click', leaveStream);

joinRoomInit();
