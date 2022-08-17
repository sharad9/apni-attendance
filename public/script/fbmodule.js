
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.3.0/firebase-app.js";

import { getDatabase, ref, set, onValue ,get} from "https://www.gstatic.com/firebasejs/9.3.0/firebase-database.js";

import {
	getAuth,
	signInWithPopup,
	GoogleAuthProvider,
	onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.3.0/firebase-auth.js";


const firebaseConfig = {
	apiKey: "AIzaSyBxZOOHaT4BLuo0WlXjrKSu5lA15GJoQ9s",
	authDomain: "apniattendance.firebaseapp.com",
	databaseURL: "https://apniattendance-default-rtdb.firebaseio.com",
	projectId: "apniattendance",
	storageBucket: "apniattendance.appspot.com",
	messagingSenderId: "842668033040",
	appId: "1:842668033040:web:197d6eae6c28a77ddd7695",
	measurementId: "G-C9LM9MJBW1"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth();
const db = getDatabase();


export { db, ref, set, get,auth, onValue, signInWithPopup, GoogleAuthProvider, onAuthStateChanged };
