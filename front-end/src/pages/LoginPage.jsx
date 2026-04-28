import { useState } from "react";
import { apiClient} from "../api/apiClient";
import { setAuthToken } from "../api/authToken";


function LoginPage({ onGoBack }){

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(){

        if(!email || !password){

            setError("Please enter email and password");
            
            return;
        }

        setLoading(true);
        setError("");

        try {
            
            const response = await apiClient("/api/login", {

                method: "POST",
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok) {

                setError(result.message || "Login failed.");
                return
            }

            if (result?.data?.token) {
                setAuthToken(result.data.token);
            }

            if (onGoBack){

                onGoBack("intro")
            }
        }

        catch (error){

            setError("Unable to reach server.");

        } finally{

            setLoading(false);
        }
    }

    async function handleSignup(){

        if(!email || !password){

            setError("Please enter email and password");
            return;
        }

        setLoading(true);
        setError("");

        try {
            
            const response = await apiClient("/api/signup", {

                method: "POST",
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok) {

                setError(result.message || "Signup failed.");
                return
            }

            if (result?.data?.token) {
                setAuthToken(result.data.token);
            }

            if (onGoBack){

                onGoBack("intro")
            }
        }

        catch (error){

            setError("Unable to reach server.");
        }

        finally{

            setLoading(false);
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

                {error && <p className ="login-error">{error}</p>}

                <div className="details">
                    
                    <span>Email</span>
                    <input
                        type="email"
                        placeholder="youremail@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className="details">
                    
                    <span>Password</span>
                    <input
                        type="password"
                        placeholder="xxxxxxxx"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className="login-buttons">

                    <button
                        className="default-login-button"
                        type="button"
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {loading ? "Please wait..." : "Log In"}

                    </button>

                    <button
                        className="sso-login-button"
                        type="button"
                        onClick={handleSignup}
                        disabled={loading}
                    >
                        {loading ? "Please wait..." : "Create Account"}
                    </button>

                </div>

            </div>

        </section>
    );
}

export default LoginPage;
