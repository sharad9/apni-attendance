
import { signInWithPopup, GoogleAuthProvider, auth, onAuthStateChanged } from "../script/fbmodule.js";

const provider = new GoogleAuthProvider();

window.GoogleLogin = function GoogleLogin() {

	signInWithPopup(auth, provider)
		.then((result) => {
			// This gives you a Google Access Token. You can use it to access the Google API.
			const credential = GoogleAuthProvider.credentialFromResult(result);
			const token = credential.accessToken;
			// The signed-in user info.
			const user = result.user;
			
			const statusButton = document.getElementById("status");
			statusButton.className = "btn btn-success btn-xs"
			statusButton.textContent = user.reloadUserInfo.email;
		
			// ...
		})
		.catch((error) => {
			// Handle Errors here.
			const errorCode = error.code;
			const errorMessage = error.message;
			// The email of the user's account used.
			const email = error.customData.email;
			// The AuthCredential type that was used.
			const credential = GoogleAuthProvider.credentialFromError(error);
			alert(error);
			// ...
		});
};



const initApp = () => {
	// Listening for auth state changes.
	onAuthStateChanged(auth, function (user) {

		//document.getElementById('quickstart-verify-email').disabled = true;
		if (user) {
			// User is signed in.
			var displayName = user.displayName;
			var email = user.email;
			var emailVerified = user.emailVerified;
			var photoURL = user.photoURL;
			var isAnonymous = user.isAnonymous;
			var uid = user.uid;
			var providerData = user.providerData;
			//document.getElementById('quickstart-sign-in-status').innerHTML = 'Signed in';
			//document.getElementById('quickstart-sign-in').innerHTML = 'Sign out';
			//document.getElementById('quickstart-account-details').innerHTML = JSON.stringify(user, null, '  ');
			const statusButton = document.getElementById("status");
			statusButton.className = "btn btn-success btn-xs";
			statusButton.textContent  = email;
			//if (!emailVerified) {
			//	document.getElementById('quickstart-verify-email').disabled = false;
			//}
		} else {
			// User is signed out.
			const statusButton = document.getElementById("status");
			statusButton.className = "btn btn-danger btn-xs";
			statusButton.textContent = "Login";
			//document.getElementById('quickstart-sign-in-status').innerHTML = 'Signed out';
			//document.getElementById('quickstart-sign-in').innerHTML = 'Sign in';
			//document.getElementById('quickstart-account-details').innerHTML = 'null';
		}
		//document.getElementById('quickstart-sign-in').disabled = false;
	});


}

window.onload = function () {
	initApp();
};