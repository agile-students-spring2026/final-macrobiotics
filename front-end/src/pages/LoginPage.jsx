import { useState } from "react";
import { apiClient} from "../api/apiClient";


function LoginPage({ onGoBack }){

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleLogin(){

        if(!email || !password){

            alert("Please enter email and password");
            return;
        }

        try {
            
            const response = await apiClient("/api/login", {

                method: "POST",
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok) {

                alert(result.message || "Login failed.");
                return
            }

            if (onGoBack){

                onGoBack("intro")
            }
        }

        catch (error){

            alert("Unable to reach server.");
        }
    }

    async function handleSignup(){

        if(!email || !password){

            alert("Please enter email and password");
            return;
        }

        try {
            
            const response = await apiClient("/api/signup", {

                method: "POST",
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok) {

                alert(result.message || "Signup failed.");
                return
            }

            if (onGoBack){

                onGoBack("intro")
            }
        }

        catch (error){

            alert("Unable to reach server.");
        }
    }

    return(

        <section className ="screen login-screen">

            <div className ="login-panel">

                <header className="login-header">
                    <p className="login-header__eyebrow">Account access</p>
                    <h2 className="login-header__title">Sign Up or Log In</h2>
                    <p className="login-header__copy">
                        Continue with your email or use your organization&apos;s single sign-on.
                    </p>
                </header>

                <div className="details">
                    
                    <span>Email</span>
                    <input
                        type="email"
                        placeholder="youremail@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="details">
                    
                    <span>Password</span>
                    <input
                        type="password"
                        placeholder="xxxxxxxx"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="login-buttons">

                    <button
                        className="default-login-button"
                        type="button"
                        onClick={handleLogin}
                    >
                        Sign Up or Log In
                    </button>

                    <button
                        className="sso-login-button"
                        type="button"
                        onClick={handleSignup}
                    >
                        Sign In With SSO
                    </button>

                </div>

            </div>

        </section>
    );
}

export default LoginPage;
