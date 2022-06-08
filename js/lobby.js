let form = document.getElementById('lobby__form');

let displayName = localStorage.getItem('display_name');
if (displayName) {
	form.name.value = displayName;
}

form.addEventListener('submit', e => {
	e.preventDefault();

	localStorage.setItem('display_name', e.target.name.value);

	let inviteCode = e.target.room.value;
	if (!inviteCode) {
		inviteCode = Math.floor(Math.random() * 10000).toString();
	}

	window.location = `room.html?room=${inviteCode}`;
});
