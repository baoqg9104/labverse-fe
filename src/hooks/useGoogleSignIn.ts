import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { firebaseAuth } from "../utils/firebaseConfig";
import api from "../utils/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "../contexts/AuthContext";
import { useContext } from "react";

export function useGoogleSignIn() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);

      const user = result.user;
      const idToken = await user.getIdToken();

      // Send the ID token to backend
      const res = await api.post("/users/authenticate/google", {
        idToken,
      });

      const { accessToken } = res.data;

      login(accessToken);

      toast.success("Sign in with Google successful!");
      navigate("/", { replace: true });
    } catch {
      toast.error("Sign in with Google failed");
    }
  };

  return signInWithGoogle;
}
