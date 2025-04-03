import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCybxi5XGIN_zzU7H8NsUWsYDE_SavOHLw",
  authDomain: "paste-shop.firebaseapp.com",
  projectId: "paste-shop",
  storageBucket: "paste-shop.appspot.com", // Corrected common typo: .appspot.com, not .firebasestorage.app
  messagingSenderId: "385823384221",
  appId: "1:385823384221:web:9c1b3fa76a71378f03ea74",
  measurementId: "G-4DHK5JJNKF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; 