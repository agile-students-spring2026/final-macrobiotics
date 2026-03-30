import { useState } from "react";

function LoginPage(){

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    return(

        <section className ="screen login-screen">

            <div className ="login-panel">

                <h2> Sign Up or Log In</h2>

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

                    <button className="default-login-button" type="button">
                        Sign Up or Log In
                    </button>

                    <button className="sso-login-button" type="button">
                        Sign In With SSO
                    </button>

                </div>

            </div>

        </section>
    );
}

export default LoginPage;